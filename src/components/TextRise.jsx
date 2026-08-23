import { motion } from 'framer-motion';

export default function TextRise({
  text,
  className = '',
  onComplete,
}) {
  const wrap = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const letter = {
    hidden: {
      y: '110%',
      opacity: 0,
    },
    visible: {
      y: '0%',
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    },
  };

  return (
    <motion.span
      className={className}
      variants={wrap}
      initial="hidden"
      animate="visible"
      onAnimationComplete={onComplete}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        paddingTop: '0.2em',
        paddingBottom: '0.2em',
        overflow: 'hidden',
      }}
    >
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            verticalAlign: 'bottom',
            whiteSpace: char === ' ' ? 'pre' : 'normal',
          }}
        >
          <motion.span
            variants={letter}
            style={{
              display: 'inline-block',
              lineHeight: '1',
            }}
          >
            {char}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}