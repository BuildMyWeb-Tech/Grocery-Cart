'use client'
import Image from "next/image"
import { MapPin, Mail, Phone, Globe, Calendar, CheckCircle, Clock, BadgeAlert } from "lucide-react"

const StoreInfo = ({store}) => {
    const statusIcons = {
        pending: <Clock size={14} className="text-yellow-600" />,
        approved: <CheckCircle size={14} className="text-green-600" />,
        rejected: <BadgeAlert size={14} className="text-red-600" />
    }

    return (
        <div className="flex-1 space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                <div className="relative">
                    <Image 
                        width={100} 
                        height={100} 
                        src={store.logo} 
                        alt={store.name} 
                        className="w-20 h-20 object-contain bg-white border border-slate-200 shadow-sm rounded-full p-1" 
                    />
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                        store.status === 'pending' ? 'bg-yellow-100' : 
                        store.status === 'rejected' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                        {statusIcons[store.status]}
                    </span>
                </div>
                
                <div className="text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="text-xl font-semibold text-slate-800">{store.name}</h3>
                        
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
                        
                        <span className="text-sm text-slate-500 font-medium">@{store.username}</span>
                        {/* Status Badge */}
                        <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                store.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : store.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                        >
                            {store.status}
                        </span>

                        
                    </div>


                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mt-4">
                <p className="text-slate-700 text-sm">{store.description}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2 text-slate-700"> 
                    <MapPin size={16} className="text-slate-400" /> 
                    <span className="text-sm">{store.address}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                    <Phone size={16} className="text-slate-400" /> 
                    <span className="text-sm">{store.contact}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                    <Mail size={16} className="text-slate-400" />  
                    <span className="text-sm">{store.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                    <Globe size={16} className="text-slate-400" />  
                    <span className="text-sm">www.{store.username}.com</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                <Calendar size={16} className="text-slate-400" />
                <p className="text-slate-600 text-sm">
                    Applied on <span className="font-medium">{new Date(store.createdAt).toLocaleDateString()}</span> by
                </p>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm mt-2">
                <Image 
                    width={36} 
                    height={36} 
                    src={store.user.image} 
                    alt={store.user.name} 
                    className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                />
                <div>
                    <p className="text-slate-700 font-medium">{store.user.name}</p>
                    <p className="text-slate-500 text-xs">{store.user.email}</p>
                </div>
            </div>
        </div>
    )
}

export default StoreInfo
