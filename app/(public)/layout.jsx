// C:\Users\Siddharathan\Desktop\Grocery-Cart\app\(public)\layout.jsx
'use client';
import Banner   from "@/components/Banner";
import Navbar   from "@/components/Navbar";
import Footer   from "@/components/Footer";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { useUser } from "@clerk/nextjs";
import { fetchCartThunk, uploadCartThunk } from "@/lib/features/cart/cartSlice";
import { fetchAddress }    from "@/lib/features/address/addressSlice";
import { fetchUserRatings } from "@/lib/features/rating/ratingSlice";

export default function PublicLayout({ children }) {
  const dispatch  = useDispatch();
  const { user }  = useUser();
  const { items } = useSelector((state) => state.cart);
  const isFirstLoad    = useRef(true);
  const prevUserRef    = useRef(null);

  // Fetch products once on mount
  useEffect(() => {
    dispatch(fetchProducts({}));
  }, []);

  // Fetch user data when user signs in
  useEffect(() => {
    if (user && prevUserRef.current !== user.id) {
      prevUserRef.current = user.id;
      dispatch(fetchCartThunk());
      dispatch(fetchAddress());
      dispatch(fetchUserRatings());
    }
  }, [user]);

  // Upload cart to DB when items change — but skip the very first render
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (user) {
      dispatch(uploadCartThunk());
    }
  }, [items]);

  return (
    <>
      <Banner />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}