'use client';

import { motion } from 'framer-motion';
import WwmLogo from './WwmLogo';
import { InkDivider } from './InkDecoration';

interface PageHeaderProps {
  englishTitle: string;
  chineseTitle: string;
  subtitle?: string;
}

export default function PageHeader({ englishTitle, chineseTitle, subtitle }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center pt-32 pb-12 relative"
    >
      {/* Small WWM mark */}
      <div className="flex justify-center mb-4">
        <WwmLogo size={36} className="opacity-40" />
      </div>

      <p className="font-display text-sm tracking-[0.3em] text-text-secondary/40 uppercase mb-3">
        {englishTitle}
      </p>
      <h1 className="font-brush text-5xl text-text-primary mb-4"
          style={{ textShadow: '0 0 30px rgba(201,168,76,0.1)' }}
      >
        {chineseTitle}
      </h1>
      {subtitle && (
        <p className="text-text-secondary text-lg">{subtitle}</p>
      )}
      <InkDivider className="mt-4" />
    </motion.div>
  );
}
