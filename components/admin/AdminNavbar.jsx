// C:\Users\Siddharathan\Desktop\Grocery-Cart\components\admin\AdminNavbar.jsx
'use client'
import { useUser, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { MenuIcon, BellIcon, XIcon } from "lucide-react"
import { useState } from "react"

const AdminNavbar = ({ setSidebarOpen, sidebarOpen }) => {
    const {user} = useUser()
    const [showNotifications, setShowNotifications] = useState(false)

    return (
        <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-slate-200 bg-white shadow-sm z-30 relative">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)} 
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors md:hidden"
                >
                    {sidebarOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
                </button>
                
                <Link href="/admin" className="relative text-2xl md:text-3xl font-semibold text-slate-800">
                    <span className="text-green-600">Grocery</span> Cart<span className="text-green-600 text-4xl leading-0">.</span>
                    <div className="absolute text-xs font-semibold -top-1 -right-13 px-2 py-0.5 rounded-full flex items-center gap-2 text-white bg-green-600">
                        Admin
                    </div>
                </Link>
            </div>
            
           
            
            <div className="flex items-center gap-4">
                {/* <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors relative"
                    >
                        <BellIcon size={20} />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <h3 className="font-medium text-slate-800">Notifications</h3>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                        <div className="flex items-start">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                                                <span className="text-xs font-medium">N</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-800">New store application</p>
                                                <p className="text-xs text-slate-500 mt-0.5">A new store is waiting for approval</p>
                                                <p className="text-xs text-slate-400 mt-1">{item * 10}m ago</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 py-2 border-t border-slate-100">
                                <button className="text-sm text-green-600 font-medium hover:text-green-700 w-full text-center">
                                    View all notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div> */}
                
                <div className="flex items-center gap-3">
                    <div className="hidden md:block">
                        <p className="text-sm font-medium text-slate-800">{user?.firstName}</p>
                        <p className="text-xs text-slate-500">Admin</p>
                    </div>
                    <UserButton />
                </div>
            </div>
        </div>
    )
}

export default AdminNavbar