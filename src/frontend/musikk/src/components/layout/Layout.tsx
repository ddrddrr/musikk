"use client"

import type React from "react"

import {Navigation} from "./Navigation"

interface LayoutProps {
    children: React.ReactNode
}

export function Layout({children}: LayoutProps) {
    return (
        <div className="flex flex-col h-screen bg-gray-200">
            <Navigation/>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">{children}</div>
        </div>
    )
}
