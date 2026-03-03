import { motion } from 'motion/react';
import { ReactNode } from 'react';

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
