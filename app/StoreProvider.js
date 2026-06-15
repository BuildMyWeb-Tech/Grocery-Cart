// app/StoreProvider.js
'use client';

import { useRef } from 'react';
import { Provider }     from 'react-redux';
import { PersistGate }  from 'redux-persist/integration/react';
import { store, persistor } from '@/lib/store';
import { Toaster }      from 'react-hot-toast';
import { useAuth }      from '@clerk/nextjs';
import { useEffect }    from 'react';
import { useDispatch }  from 'react-redux';
import { fetchCartThunk } from '@/lib/features/cart/cartSlice';

// Loads DB cart + creates user row on sign-in
function UserBootstrapper() {
  const { isSignedIn } = useAuth();
  const dispatch       = useDispatch();
  const didLoad        = useRef(false);

  useEffect(() => {
    if (!isSignedIn || didLoad.current) return;
    didLoad.current = true;
    dispatch(fetchCartThunk());
  }, [isSignedIn]);

  return null;
}

export default function StoreProvider({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <UserBootstrapper />
        <Toaster position="top-center" />
        {children}
      </PersistGate>
    </Provider>
  );
}