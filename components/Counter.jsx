'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Counter = ({ productId }) => {
    const dispatch = useDispatch();
    const cartItems = useSelector(state => state.cart.items || []);
    
    // Find the specific product in the cart
    const cartItem = cartItems.find(item => item.id === productId);
    const quantity = cartItem ? cartItem.quantity : 0;

    const addToCartHandler = () => {
        // Create a product object with just enough data for the action
        const product = {
            id: productId,
            quantity: 1
        };
        dispatch(addToCart({ product }));
    }

    const removeFromCartHandler = () => {
        dispatch(removeFromCart(productId));
    }

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
            <button 
                onClick={removeFromCartHandler} 
                className="p-1 select-none hover:text-red-500 transition-colors w-7 flex items-center justify-center"
            >
                -
            </button>
            <p className="p-1 min-w-[20px] text-center">{quantity}</p>
            <button 
                onClick={addToCartHandler} 
                className="p-1 select-none hover:text-green-500 transition-colors w-7 flex items-center justify-center"
            >
                +
            </button>
        </div>
    )
}

export default Counter
