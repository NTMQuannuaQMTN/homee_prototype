import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, FlatList, Keyboard, Modal, PanResponder, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import tw from 'twrnc';
import LocationIcon from '../../assets/icons/location.svg';

interface LocationType {
  search: string;
  selected: string;
  rsvpFirst: boolean;
  name: string;
  aptSuite: string;
  notes: string;
}

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  location: LocationType;
  setLocation: (loc: LocationType | ((prev: LocationType) => LocationType)) => void;
  locations?: { address: string; city: string }[]; // This might become initial suggestions or predefined options
}

// Interface for Nominatim fetched suggestions
interface NominatimLocationSuggestion {
  address: string; // display_name from Nominatim
  city: string;    // derived from Nominatim's address object
  // You might add more fields like lat, lon, place_id etc. if needed
}


function LocationModal({ visible, onClose, location, setLocation, locations }: LocationModalProps) {
  const [currentLon, setCurLon] = useState(0);
  const [currentLat, setCurLat] = useState(0);

  const getUserLocation = async () => {
    let {status} = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('We have to get your location');
      return;
    }

    let {coords} = await Location.getCurrentPositionAsync();
    
    if (coords) {
      const { longitude, latitude } = coords;
      setCurLon(longitude);
      setCurLat(latitude);
    }
  }

  useEffect(() => {getUserLocation()}, [])

  const safeLocations = Array.isArray(locations) ? locations : [];

  // --- Local state for modal fields ---
  const [localLocation, setLocalLocation] = useState<LocationType>(location);

  // --- Draggable Modal Logic (from cohost.tsx) ---
  const MODAL_HEIGHT = 760;
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const [isModalMounted, setIsModalMounted] = useState(false);

  // --- State for Nominatim suggestions ---
  const [nominatimSuggestions, setNominatimSuggestions] = useState<NominatimLocationSuggestion[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Disable pan responder when FlatList is being scrolled
  const [disablePan, setDisablePan] = useState(false);

  // Save: update parent state and close
  const handleSave = () => {
    setLocation(localLocation);
    onClose();
  };
  // Cancel: just close, don't update parent
  const handleCancel = () => {
    onClose();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disablePan,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return !disablePan && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return !disablePan && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 0;
      },
      onPanResponderGrant: (evt, gestureState) => {
        slideAnim.stopAnimation();
        pan.setOffset({ x: 0, y: (slideAnim as any).__getValue() });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gestureState) => {
        const clampedDy = Math.max(0, gestureState.dy);
        pan.setValue({ x: 0, y: clampedDy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        const currentPosition = (pan.y as any).__getValue ? (pan.y as any).__getValue() : 0;
        const slideDownThreshold = MODAL_HEIGHT * 0.3;
        const velocityThreshold = 0.5;
        if (currentPosition > slideDownThreshold || gestureState.vy > velocityThreshold) {
          Animated.timing(slideAnim, {
            toValue: MODAL_HEIGHT,
            duration: 250,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 10,
          }).start(() => {
            pan.setValue({ x: 0, y: 0 });
          });
        }
      },
    })
  ).current;

  // When modal opens, initialize local state from prop
  useEffect(() => {
    if (visible) {
      setLocalLocation(location);
      setIsModalMounted(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsModalMounted(false);
        pan.setValue({ x: 0, y: 0 });
        setNominatimSuggestions([]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // --- Debounced API call for location search using Nominatim ---
  const fetchNominatimSuggestions = useCallback(async (query: string) => {
    // To get locations within 1.5km of the current location, you need to know the user's current latitude and longitude.
    // We'll assume you have access to `currentLat` and `currentLon` variables (numbers).
    // Nominatim supports a "viewbox" and "bounded" parameter to restrict results to a bounding box.
    // We'll calculate a bounding box of ~1.5km around the current location.

    if (query.length < 3) {
      setNominatimSuggestions([]);
      return;
    }

    // Haversine approximation for 1.5km in degrees
    const R = 6371; // Earth radius in km
    const distance = 1.5; // 1.5km
    // 1 degree latitude ~= 111km
    const latDiff = distance / 111;
    // 1 degree longitude ~= 111km * cos(latitude)
    // We'll use Math.abs in case of negative latitudes
    const lonDiff = distance / (111 * Math.cos((currentLat * Math.PI) / 180));

    const minLat = currentLat - latDiff;
    const maxLat = currentLat + latDiff;
    const minLon = currentLon - lonDiff;
    const maxLon = currentLon + lonDiff;

    // Nominatim viewbox: left,top,right,bottom (lon,lat,lon,lat)
    // bounded=1 restricts results to the box
    const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=20&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1`;

    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'YourEventApp/1.0 (contact@yourappdomain.com)',
        },
      });
      const data: any[] = await response.json();
      console.log(data);
      const suggestions: NominatimLocationSuggestion[] = data.map((item: any) => ({
        address: item.display_name,
        city: item.address?.city || item.address?.town || item.address?.village || item.address?.county || '',
      }));
      setNominatimSuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching Nominatim suggestions:", error);
      setNominatimSuggestions([]);
    }
  }, [currentLat, currentLon]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (localLocation.search) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchNominatimSuggestions(localLocation.search);
      }, 500);
    } else {
      setNominatimSuggestions([]);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localLocation.search, fetchNominatimSuggestions]);

  if (!isModalMounted) return null;

  const combinedTranslateY = Animated.add(slideAnim, pan.y);

  return (
    <Modal
      visible={visible || isModalMounted}
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={tw`flex-1 justify-end items-center`}>
        {/* Backdrop for closing the modal by tapping outside */}
        <TouchableOpacity
          style={tw`absolute inset-0 bg-black/50`}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <Animated.View
          style={[
            tw`w-full px-0 pt-6 pb-0 rounded-t-2xl`,
            {
              backgroundColor: '#080B32',
              height: MODAL_HEIGHT,
            },
            {
              transform: [{ translateY: combinedTranslateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flexGrow: 1 }}>
              <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
                <View>
                  {/* Gray drag handle */}
                  <View style={tw`w-12 h-1.5 bg-gray-500 rounded-full self-center mb-3`} />
                  <View style={[tw`flex-row items-center mb-4`, { justifyContent: 'space-between', position: 'relative' }]}>
                    <View style={{ width: 70, alignItems: 'flex-start' }}>
                      <TouchableOpacity
                        onPress={() => {
                          const cleared = { search: '', selected: '', rsvpFirst: false, name: '', aptSuite: '', notes: '' };
                          setLocalLocation(cleared);
                          setLocation(cleared);
                        }}
                        style={tw`px-3 py-1`}
                        activeOpacity={0.7}
                      >
                        <Text style={[tw`text-[#7A5CFA] text-[13px]`, { fontFamily: 'Nunito-Bold' }]}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, pointerEvents: 'none' }}>
                      <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>Set event location</Text>
                    </View>
                    <View style={{ width: 70 }} />
                  </View>
                  {/* Set location box with search icon */}
                  <View style={tw`mb-2.5 mx-3 bg-white/10 rounded-xl px-3 py-4`}>
                    <View style={tw`flex-row items-center`}>
                      <Ionicons name="search" size={16} color="#9ca3af" style={tw`mr-2`} />
                      <TextInput
                        style={[tw`flex-1 text-white`, { fontFamily: 'Nunito-Medium', fontSize: 14 }]}
                        placeholder="Set your location"
                        placeholderTextColor="#9ca3af"
                        value={localLocation.search}
                        onChangeText={text => {
                          setLocalLocation(loc => {
                            const newLoc = { ...loc, search: text };
                            if (loc.selected && text !== loc.selected) {
                              newLoc.selected = '';
                            }
                            return newLoc;
                          });
                        }}
                      />
                      {localLocation.search.length > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            setLocalLocation(loc => ({ ...loc, search: '', selected: '' }));
                          }}
                          style={tw`pl-1.5`}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-circle" size={18} color="#9ca3af" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>


                  {/* --- Display Nominatim Suggestions as FlatList --- */}
                  {nominatimSuggestions.length > 0 && localLocation.search !== localLocation.selected && (
                    <View style={tw`mx-3 mb-3 bg-white/10 rounded-xl max-h-48`}>
                      <FlatList
                        data={nominatimSuggestions}
                        keyExtractor={(item, idx) => item.address + idx}
                        showsVerticalScrollIndicator={false}
                        onScrollBeginDrag={() => setDisablePan(true)}
                        onScrollEndDrag={() => setDisablePan(false)}
                        onMomentumScrollEnd={() => setDisablePan(false)}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={tw`flex-row items-start px-3 py-2 border-b border-white/5`}
                            onPress={() => {
                              setLocalLocation(loca => ({
                                ...loca,
                                selected: item.address,
                                search: item.address,
                                name: item.address,
                              }));
                              setNominatimSuggestions([]);
                              if (searchTimeoutRef.current) {
                                clearTimeout(searchTimeoutRef.current);
                              }
                              Keyboard.dismiss();
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="location-outline" size={16} color="#9ca3af" style={tw`mr-3`} />
                            <View style={tw`flex-1`}>
                              <Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-Medium' }]}>{item.address}</Text>
                              {!!item.city && (
                                <Text style={[tw`text-gray-400 text-[12px]`, { fontFamily: 'Nunito-Regular' }]}>{item.city}</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  )}

                  {/* --- Use [typing] as location option --- */}
                  {localLocation.search.length > 0 &&
                    localLocation.search !== localLocation.selected &&
                    // Only show if not an exact match for any suggestion
                    !nominatimSuggestions.some(s => s.address === localLocation.search) && (
                      <TouchableOpacity
                        style={tw`mx-3 mb-3 bg-white/10 rounded-xl px-3 py-3 flex-row items-center`}
                        onPress={() => {
                          setLocalLocation(loca => ({
                            ...loca,
                            selected: localLocation.search,
                            search: localLocation.search,
                            name: localLocation.search,
                          }));
                          setNominatimSuggestions([]);
                          if (searchTimeoutRef.current) {
                            clearTimeout(searchTimeoutRef.current);
                          }
                          Keyboard.dismiss();
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add-circle-outline" size={18} color="#7A5CFA" style={tw`mr-2`} />
                        <Text style={[tw`text-[#7A5CFA] text-[14px]`, { fontFamily: 'Nunito-Bold' }]}>Use "{localLocation.search}" as your location</Text>
                      </TouchableOpacity>
                    )}

                  {/* Existing Location list (if you want to keep predefined locations, these would typically be hidden if search results are showing) */}
                  {safeLocations.length > 0 && nominatimSuggestions.length === 0 && (
                    <View style={tw`mb-4 mx-3`}>
                      {safeLocations.map((loc, idx) => (
                        <TouchableOpacity
                          key={`predefined-${idx}`}
                          style={[tw`flex-row items-start mb-2`, { opacity: localLocation.selected === loc.address ? 1 : 0.7 }]}
                          onPress={() => setLocalLocation(loca => ({ ...loca, selected: loc.address, search: loc.address }))}
                          activeOpacity={0.7}
                        >
                          <LocationIcon width={16} height={16} style={{ marginTop: 2, marginRight: 6 }} />
                          <View>
                            <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-Bold' }]}>{loc.address}</Text>
                            <Text style={[tw`text-[#B0B8C1] text-[13px]`, { fontFamily: 'Nunito-Medium' }]}>{loc.city}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* RSVP checkbox */}
                  <TouchableOpacity
                    style={tw`flex-row items-center mx-3.5`}
                    onPress={() => setLocalLocation(loc => ({ ...loc, rsvpFirst: !localLocation.rsvpFirst }))}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      tw`w-[0.9rem] h-[0.9rem] rounded border border-gray-400 items-center justify-center mr-2`,
                      localLocation.rsvpFirst ? tw`bg-[#7A5CFA]` : tw`bg-white/10`
                    ]}>
                      {localLocation.rsvpFirst && (
                        <View style={tw`w-2 h-2`} />
                      )}
                    </View>
                    <Text style={[
                      tw`${localLocation.rsvpFirst ? 'text-white' : 'text-gray-400'} text-[13px]`,
                      { fontFamily: 'Nunito-Medium' }
                    ]}>
                      Guests must RSVP first to see location
                    </Text>
                  </TouchableOpacity>
                  {/* Display name */}
                  {localLocation.selected &&
                    <View style={tw`mb-2 mx-3 mt-4`}>
                      <Text style={[tw`text-white text-[13px] mb-1`, { fontFamily: 'Nunito-Bold' }]}>Display name</Text>
                      <View style={tw`bg-white/10 rounded-xl px-3 py-4 flex-row items-center`}>
                        <TextInput
                          style={[tw`flex-1 text-white text-[13px]`, { fontFamily: 'Nunito-Medium' }]}
                          placeholder="eg. Jonny's apartment"
                          placeholderTextColor="#9ca3af"
                          value={localLocation.name}
                          onChangeText={text => setLocalLocation(loc => ({ ...loc, name: text }))}
                        />
                        {localLocation.name.length > 0 && (
                          <TouchableOpacity
                            onPress={() => setLocalLocation(loc => ({ ...loc, name: '' }))}
                            style={tw`pl-1.5`}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close-circle" size={18} color="#9ca3af" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  }
                  {/* Apt / Suite / Floor */}
                  {localLocation.selected &&
                    <View style={tw`mb-2 mx-3`}>
                      <Text style={[tw`text-white text-[13px] mb-1`, { fontFamily: 'Nunito-Bold' }]}>Apt / Suite / Floor</Text>
                      <View style={tw`bg-white/10 rounded-xl px-3 py-4 flex-row items-center`}>
                        <TextInput
                          style={[tw`flex-1 text-white text-[13px]`, { fontFamily: 'Nunito-Medium' }]}
                          placeholder="eg. Room 12E"
                          placeholderTextColor="#9ca3af"
                          value={localLocation.aptSuite}
                          onChangeText={text => setLocalLocation(loc => ({ ...loc, aptSuite: text }))}
                        />
                        {localLocation.aptSuite.length > 0 && (
                          <TouchableOpacity
                            onPress={() => setLocalLocation(loc => ({ ...loc, aptSuite: '' }))}
                            style={tw`pl-1.5`}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close-circle" size={18} color="#9ca3af" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  }
                  {/* Further notes */}
                  {localLocation.selected &&
                    <View style={tw`mb-4 mx-3`}>
                      <Text style={[tw`text-white text-[13px] mb-1`, { fontFamily: 'Nunito-Bold' }]}>Further notes</Text>
                      <View style={tw`bg-white/10 rounded-xl px-3 py-4 flex-row items-center`}>
                        <TextInput
                          style={[tw`flex-1 text-white text-[13px]`, { fontFamily: 'Nunito-Medium' }]}
                          placeholder="eg. take the second elevator, not the first one"
                          placeholderTextColor="#9ca3af"
                          value={localLocation.notes}
                          onChangeText={text => setLocalLocation(loc => ({ ...loc, notes: text }))}
                        />
                        {localLocation.notes.length > 0 && (
                          <TouchableOpacity
                            onPress={() => setLocalLocation(loc => ({ ...loc, notes: '' }))}
                            style={tw`pl-1.5`}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close-circle" size={18} color="#9ca3af" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  }
                </View>
                {/* Save and Cancel buttons always at the bottom */}
                <View style={tw`px-3 pb-8`}>
                  <TouchableOpacity
                    style={[tw`bg-[#7A5CFA] rounded-full py-3 items-center mb-2`, { opacity: 1 }]}
                    onPress={handleSave}
                    activeOpacity={0.8}
                  >
                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[tw`bg-white/5 rounded-full py-3 items-center`, { opacity: 1 }]}
                    onPress={handleCancel}
                    activeOpacity={0.8}
                  >
                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </Modal>
  );
}
export default LocationModal;