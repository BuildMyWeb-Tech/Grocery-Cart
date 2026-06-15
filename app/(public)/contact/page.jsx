"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate submission — replace with real API call if needed
        await new Promise((r) => setTimeout(r, 1200));
        toast.success("Message sent! We'll get back to you soon.");
        setForm({ name: "", email: "", subject: "", message: "" });
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800">
                        Contact <span className="text-green-600">Us</span>
                    </h1>
                    <p className="text-slate-500 mt-3 max-w-lg mx-auto">
                        Have a question or need help? We're here for you. Fill in the form and we'll respond within 24 hours.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                <Mail size={18} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">Email</p>
                                <p className="text-sm text-slate-500 mt-0.5">support@kingcart.com</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Phone size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">Phone</p>
                                <p className="text-sm text-slate-500 mt-0.5">+91 98765 43210</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                                <MapPin size={18} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">Address</p>
                                <p className="text-sm text-slate-500 mt-0.5">Chennai, Tamil Nadu, India</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <label className="flex flex-col gap-1.5 flex-1">
                                    <span className="text-sm font-medium text-slate-600">Name</span>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Your name"
                                        required
                                        className="p-2.5 px-3 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-green-100 text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5 flex-1">
                                    <span className="text-sm font-medium text-slate-600">Email</span>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="your@email.com"
                                        required
                                        className="p-2.5 px-3 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-green-100 text-sm"
                                    />
                                </label>
                            </div>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-600">Subject</span>
                                <input
                                    type="text"
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    placeholder="How can we help?"
                                    required
                                    className="p-2.5 px-3 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-green-100 text-sm"
                                />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-600">Message</span>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="Tell us more..."
                                    rows={5}
                                    required
                                    className="p-2.5 px-3 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-green-100 text-sm resize-none"
                                />
                            </label>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? (
                                        <><Loader2 size={16} className="animate-spin" /> Sending...</>
                                    ) : (
                                        <><Send size={16} /> Send Message</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}