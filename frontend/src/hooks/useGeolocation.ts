import { useEffect } from 'react';
import { useStore } from '../store';

export function useGeolocation() {
  const setUserPosition = useStore((s) => s.setUserPosition);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setUserPosition(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);
}
