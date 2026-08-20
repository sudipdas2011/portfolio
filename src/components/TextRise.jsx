import { motion } from 'framer-motion';

export default function TextRise({ text, className = "", onComplete }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06, 
      },
    },
  };

  const letterVariants = {
    hidden: { 
      y: "110%", // Pushes it completely out of view below the line
      opacity: 0 
    },
    visible: { 
      y: "0%", 
      opacity: 1,
      transition: { 
        duration: 0.6, 
        ease: [0.2, 0.65, 0.3, 0.9] 
      } 
    },
  };

  return (
    <motion.span 
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onAnimationComplete={onComplete} // Triggers when the final letter finishes rising
      style={{ 
        display: 'inline-flex', 
        flexWrap: 'wrap',
        paddingTop: '0.2em',    // Prevents clipping at the top
        paddingBottom: '0.2em', // Prevents clipping at the bottom
        overflow: 'hidden'
      }}
    >
      {text.split("").map((char, index) => (
        <span
          key={index}
          style={{ 
            display: 'inline-block',
            overflow: 'hidden', // Each individual letter handles its own clip line
            verticalAlign: 'bottom',
            whiteSpace: char === " " ? "pre" : "normal"
          }}
        >
          <motion.span
            variants={letterVariants}
            style={{ 
              display: 'inline-block',
              lineHeight: '1'
            }}
          >
            {char}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
