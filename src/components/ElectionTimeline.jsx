import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Calendar as CalendarIcon, Users, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTimelineData } from '../utils/useTimelineData';

export default function ElectionTimeline() {
  const { t } = useTranslation();
  const { schedules, loading } = useTimelineData();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-4xl font-black mb-12 flex items-center bg-tertiary p-4 brutal-border shadow-brutal-sm inline-block -rotate-1 uppercase">
        <CalendarIcon className="mr-4 stroke-[3] w-10 h-10" />
        {t('timeline')}
      </h2>

      {loading ? (
        <div className="animate-pulse space-y-6">
          {[1,2,3,4,5].map(i => <div key={i} className="h-36 bg-gray-200 brutal-border shadow-brutal-sm"></div>)}
        </div>
      ) : schedules.length === 0 ? (
        <div className="brutal-card p-10 text-center bg-white">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-30 stroke-[2]" />
          <p className="text-2xl font-bold uppercase">Loading election data...</p>
          <p className="text-lg font-semibold text-gray-500 mt-2">Please wait while we seed the database for the first time.</p>
        </div>
      ) : (
        <ol className="relative border-l-8 border-brutalBlack ml-8 space-y-12 pb-12" role="list" aria-label="Election schedule timeline">
          {schedules.map((schedule, idx) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              key={schedule.id} 
              className="relative pl-12"
            >
              {/* Timeline dot */}
              <div className={`absolute w-10 h-10 -left-[24px] top-6 brutal-border flex items-center justify-center font-black text-sm ${schedule.type === 'count' ? 'bg-secondary text-white' : 'bg-primary text-brutalBlack'}`}>
                {idx + 1}
              </div>
              
              <div className="brutal-card p-8 bg-white hover:-translate-y-1 hover:shadow-brutal transition-all">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <h3 className="text-2xl font-black uppercase">{schedule.region}</h3>
                  <span className={`px-4 py-2 brutal-border font-black uppercase text-sm whitespace-nowrap ${schedule.type === 'count' ? 'bg-secondary text-white' : 'bg-primary text-black'}`}>
                    {schedule.type === 'count' ? t('countingDate') : t('pollingPhase')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 mb-4">
                  <p className="text-xl font-bold flex items-center bg-gray-100 px-3 py-2 brutal-border shadow-brutal-sm">
                    <CalendarIcon className="w-6 h-6 mr-2 stroke-[3]" />
                    {schedule.date}
                  </p>
                  {schedule.electors && (
                    <p className="text-xl font-bold flex items-center bg-tertiary px-3 py-2 brutal-border shadow-brutal-sm">
                      <Users className="w-6 h-6 mr-2 stroke-[3]" />
                      {t('eligibleElectors')}: {schedule.electors}
                    </p>
                  )}
                </div>

                {schedule.description && (
                  <p className="text-lg font-semibold text-gray-700 flex items-start gap-2 bg-gray-50 p-3 brutal-border">
                    <ChevronRight className="w-5 h-5 mt-0.5 shrink-0 stroke-[3]" />
                    {schedule.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </ol>
      )}

      <div className="mt-12 brutal-card bg-primary p-8 rotate-1">
        <h3 className="text-3xl font-black uppercase mb-4">{t('didYouKnow')}</h3>
        <p className="text-xl font-bold bg-white p-4 brutal-border">
          {t('timelineFact')}
        </p>
      </div>
    </div>
  );
}
