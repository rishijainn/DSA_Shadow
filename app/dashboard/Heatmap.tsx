'use client'
import React, { useMemo } from 'react'

interface ActivityDay {
    date: string
    status: string
    reviews_due: number
    reviews_solved: number
    new_solved: number
}

export default function Heatmap({ activity }: { activity: ActivityDay[] }) {
    // Generate dates for the last 12 weeks
    const today = new Date()
    const weeks = useMemo(() => {
        const result = []
        let currentDay = new Date(today)
        // Find the most recent Sunday to start the grid
        currentDay.setDate(currentDay.getDate() - currentDay.getDay())

        // Go back 14 weeks
        for (let w = 0; w < 14; w++) {
            const week = []
            for (let d = 0; d < 7; d++) {
                const dateStr = currentDay.toISOString().split('T')[0]
                const dayData = activity.find(a => a.date === dateStr)
                week.push({
                    date: dateStr,
                    status: dayData?.status || 'none',
                    data: dayData
                })
                currentDay.setDate(currentDay.getDate() + 1)
            }
            // We want the most recent week at the end, so we prepended or reversed later
            result.push(week)
            // Go back 2 weeks then forward 1 to iterate backwards? No, let's just go back 15 weeks and iterate forward.
        }
        return result
    }, [activity])

    // Redo logic to go back 20 weeks and iterate forward
    const weeksCorrect = useMemo(() => {
        const daysToShow = 20 * 7
        const startDate = new Date(today)
        startDate.setDate(startDate.getDate() - daysToShow + (7 - today.getDay() - 1)) // Align to end on Saturday/Sunday
        
        const result = []
        let tempDate = new Date(startDate)
        
        for (let w = 0; w < 20; w++) {
            const week = []
            for (let d = 0; d < 7; d++) {
                const dateStr = tempDate.toISOString().split('T')[0]
                const dayData = activity.find(a => a.date === dateStr)
                week.push({
                    date: dateStr,
                    status: dayData?.status || 'none',
                    isFuture: tempDate > today
                })
                tempDate.setDate(tempDate.getDate() + 1)
            }
            result.push(week)
        }
        return result
    }, [activity])

    return (
        <div className="bg-[#151515] border border-[#222] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] text-muted font-bold tracking-[0.2em] uppercase">Consistency Map</h3>
                <div className="flex gap-4 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm bg-[#1a1a1a] border border-[#333]" />
                        <span className="text-[#666]">NONE</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm bg-orange/40 border border-orange/40" />
                        <span className="text-orange/70">PARTIAL</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm bg-green/60 border border-green" />
                        <span className="text-green">COMPLETED</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                {weeksCorrect.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1.5 flex-shrink-0">
                        {week.map((day, di) => {
                            let colorClass = "bg-[#1a1a1a] border-[#222]"
                            if (day.isFuture) colorClass = "bg-[#0c0c0c] border-[#111]"
                            else if (day.status === 'green') colorClass = "bg-green border-green shadow-[0_0_8px_rgba(46,204,113,0.3)]"
                            else if (day.status === 'orange') colorClass = "bg-orange/40 border-orange/60"

                            return (
                                <div 
                                    key={day.date} 
                                    className={`w-3 h-3 rounded-sm border transition-all duration-500 ${colorClass}`}
                                    title={day.date}
                                />
                            )
                        })}
                    </div>
                ))}
            </div>
            
            <div className="mt-4 flex justify-between text-[9px] font-mono text-[#444] tracking-widest uppercase">
                <span>Last 20 Weeks</span>
                <span>Active Systems Logged</span>
            </div>
        </div>
    )
}
