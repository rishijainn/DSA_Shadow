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
    const today = useMemo(() => new Date(), [])

    // Build 20 weeks of dates going back from today, aligned to week boundaries
    const weeksCorrect = useMemo(() => {
        const daysToShow = 20 * 7
        const startDate = new Date(today)
        // Go back (daysToShow - 1) days, then align to Sunday
        startDate.setDate(startDate.getDate() - (daysToShow - 1))
        startDate.setDate(startDate.getDate() - startDate.getDay()) // align to Sunday

        const result = []
        const tempDate = new Date(startDate)

        for (let w = 0; w < 20; w++) {
            const week = []
            for (let d = 0; d < 7; d++) {
                const dateStr = tempDate.toISOString().split('T')[0]
                const dayData = activity.find(a => a.date === dateStr)
                week.push({
                    date: dateStr,
                    status: dayData?.status || 'none',
                    solved: dayData ? (dayData.reviews_solved + dayData.new_solved) : 0,
                    isFuture: tempDate > today
                })
                tempDate.setDate(tempDate.getDate() + 1)
            }
            result.push(week)
        }
        return result
    }, [activity, today])

    return (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[9px] text-[#444] font-bold tracking-[0.25em] uppercase">Consistency Map</h3>
                <div className="flex gap-4 text-[9px] font-mono items-center">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#1a1a1a] border border-[#2a2a2a]" />
                        <span className="text-[#444]">None</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-orange-500/40 border border-orange-500/50" />
                        <span className="text-orange-500/70">Partial</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#2ecc71]/70 border border-[#2ecc71]" />
                        <span className="text-[#2ecc71]/80">Complete</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {weeksCorrect.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1 flex-shrink-0">
                        {week.map((day) => {
                            let cls = 'bg-[#161616] border-[#1e1e1e]'
                            let glow = ''
                            if (day.isFuture) {
                                cls = 'bg-[#0c0c0c] border-[#111]'
                            } else if (day.status === 'green') {
                                cls = 'bg-[#2ecc71]/70 border-[#2ecc71]/80'
                                glow = 'shadow-[0_0_4px_rgba(46,204,113,0.4)]'
                            } else if (day.status === 'orange') {
                                cls = 'bg-orange-500/35 border-orange-500/50'
                            }

                            return (
                                <div
                                    key={day.date}
                                    className={`w-3 h-3 rounded-sm border transition-all duration-300 hover:scale-125 hover:z-10 relative cursor-default ${cls} ${glow}`}
                                    title={`${day.date}${day.solved > 0 ? ` · ${day.solved} solved` : ''}`}
                                />
                            )
                        })}
                    </div>
                ))}
            </div>

            <div className="mt-4 flex justify-between text-[9px] font-mono text-[#2a2a2a] tracking-widest uppercase">
                <span>Last 20 Weeks</span>
                <span>{activity.filter(a => a.status !== 'none').length} Active Days</span>
            </div>
        </div>
    )
}
