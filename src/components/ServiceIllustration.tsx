import React from "react";
import { motion, Variants } from "motion/react";

interface ServiceIllustrationProps {
  type: "web" | "app" | "automation";
}

export const ServiceIllustration: React.FC<ServiceIllustrationProps> = ({
  type,
}) => {
  const containerVariants: Variants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const floatingVariants: Variants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  if (type === "web") {
    return (
      <motion.svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        variants={containerVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {/* Browser Illustration Group */}
        <motion.g variants={floatingVariants} animate="animate">
          {/* Browser Frame */}
          <motion.rect
            x="40"
            y="80"
            width="320"
            height="240"
            rx="12"
            className="fill-oxford-blue/20 stroke-blue-ncs/30"
            strokeWidth="2"
            variants={itemVariants}
          />
          <motion.rect
            x="40"
            y="80"
            width="320"
            height="30"
            rx="12"
            className="fill-blue-ncs/20"
            variants={itemVariants}
          />
          {/* Browser Dots */}
          <circle cx="65" cy="95" r="5" className="fill-blue-ncs/40" />
          <circle cx="85" cy="95" r="5" className="fill-blue-ncs/40" />
          <circle cx="105" cy="95" r="5" className="fill-blue-ncs/40" />

          {/* Content Blocks */}
          <motion.rect
            x="70"
            y="130"
            width="120"
            height="100"
            rx="8"
            className="fill-blue-ncs/10 stroke-blue-ncs/20"
            variants={itemVariants}
          />
          <motion.rect
            x="210"
            y="130"
            width="120"
            height="15"
            rx="4"
            className="fill-blue-ncs/30"
            variants={itemVariants}
          />
          <motion.rect
            x="210"
            y="155"
            width="100"
            height="10"
            rx="4"
            className="fill-blue-ncs/20"
            variants={itemVariants}
          />
          <motion.rect
            x="210"
            y="175"
            width="120"
            height="10"
            rx="4"
            className="fill-blue-ncs/20"
            variants={itemVariants}
          />
        </motion.g>
      </motion.svg>
    );
  }

  if (type === "app") {
    return (
      <motion.svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        variants={containerVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {/* Mobile Phone Frame */}
        <motion.rect
          x="120"
          y="40"
          width="160"
          height="320"
          rx="24"
          className="fill-oxford-blue/20 stroke-blue-ncs/30"
          strokeWidth="4"
          variants={itemVariants}
        />
        {/* Screen */}
        <motion.rect
          x="135"
          y="70"
          width="130"
          height="260"
          rx="12"
          className="fill-blue-ncs/5"
          variants={itemVariants}
        />

        {/* UI Elements */}
        <motion.rect
          x="150"
          y="100"
          width="100"
          height="40"
          rx="8"
          className="fill-blue-ncs/20 stroke-blue-ncs/30"
          variants={itemVariants}
        />
        <motion.circle
          cx="165"
          cy="170"
          r="15"
          className="fill-blue-ncs/30"
          variants={itemVariants}
        />
        <motion.rect
          x="190"
          y="165"
          width="60"
          height="10"
          rx="4"
          className="fill-blue-ncs/20"
          variants={itemVariants}
        />

        {/* Floating Abstract Elements */}
        <motion.g variants={floatingVariants} animate="animate">
          <rect
            x="60"
            y="120"
            width="80"
            height="50"
            rx="8"
            className="fill-blue-ncs/10 stroke-blue-ncs/20"
            strokeWidth="2"
          />
          <path
            d="M100 170 L120 190"
            className="stroke-blue-ncs/30"
            strokeWidth="2"
          />
        </motion.g>

        <motion.g
          variants={{
            animate: {
              y: [0, 15, 0],
              x: [0, -10, 0],
              transition: {
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            },
          }}
          animate="animate"
        >
          <rect
            x="260"
            y="220"
            width="90"
            height="60"
            rx="8"
            className="fill-blue-ncs/10 stroke-blue-ncs/20"
            strokeWidth="2"
          />
          <circle cx="305" cy="250" r="10" className="fill-blue-ncs/20" />
        </motion.g>

        {/* Interaction Cursor */}
        <motion.circle
          cx="240"
          cy="300"
          r="8"
          className="fill-blue-ncs"
          variants={{
            animate: {
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
              transition: { duration: 2, repeat: Infinity },
            },
          }}
          animate="animate"
        />
      </motion.svg>
    );
  }

  if (type === "automation") {
    return (
      <motion.svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        variants={containerVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {/* Central Hub */}
        <motion.circle
          cx="200"
          cy="200"
          r="40"
          className="fill-blue-ncs/20 stroke-blue-ncs/40"
          strokeWidth="2"
          variants={itemVariants}
        />
        <motion.path
          d="M185 200 L215 200 M200 185 L200 215"
          className="stroke-blue-ncs"
          strokeWidth="3"
          strokeLinecap="round"
          variants={itemVariants}
        />

        {/* Connected Nodes */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const x = 200 + 120 * Math.cos((angle * Math.PI) / 180);
          const y = 200 + 120 * Math.sin((angle * Math.PI) / 180);
          const xLine = 200 + 40 * Math.cos((angle * Math.PI) / 180);
          const yLine = 200 + 40 * Math.sin((angle * Math.PI) / 180);

          return (
            <React.Fragment key={i}>
              <motion.line
                x1={xLine}
                y1={yLine}
                x2={x}
                y2={y}
                className="stroke-blue-ncs/30"
                strokeWidth="2"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
              <motion.circle
                cx={x}
                cy={y}
                r="15"
                className="fill-oxford-blue/40 stroke-blue-ncs/30"
                strokeWidth="2"
                variants={itemVariants}
              />
              <motion.circle
                cx={x}
                cy={y}
                r="5"
                className="fill-blue-ncs"
                variants={{
                  animate: {
                    scale: [1, 1.5, 1],
                    opacity: [0.4, 1, 0.4],
                    transition: {
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                    },
                  },
                }}
                animate="animate"
              />
            </React.Fragment>
          );
        })}

        {/* Abstract "Flow" lines */}
        <motion.path
          d="M50 50 Q 200 20 350 50"
          className="stroke-blue-ncs/10"
          strokeWidth="2"
          fill="none"
          variants={floatingVariants}
          animate="animate"
        />
        <motion.path
          d="M50 350 Q 200 380 350 350"
          className="stroke-blue-ncs/10"
          strokeWidth="2"
          fill="none"
          variants={floatingVariants}
          animate="animate"
        />
      </motion.svg>
    );
  }

  return null;
};
