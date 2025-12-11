"use client";

import { motion } from "motion/react";
import { useState, FormEvent } from "react";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string; // Honeypot field
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "", // Honeypot field - should remain empty
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const consultLink = "https://calendly.com/kylegreer-kygrsolutions/30min";

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.email.length > 255) {
      newErrors.email = "Email must be less than 255 characters";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.length > 200) {
      newErrors.subject = "Subject must be less than 200 characters";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length > 5000) {
      newErrors.message = "Message must be less than 5000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitStatus({ type: null, message: "" });

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          website: formData.website, // Honeypot field
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitStatus({
        type: "success",
        message:
          data.message ||
          "Thank you for your message! I'll get back to you soon.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        website: "",
      });
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.section
      id="contact"
      className="py-12 md:py-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.div
        className="card bg-oxford-blue/90 backdrop-blur-sm border border-penn-blue p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl max-w-3xl mx-auto"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-text-headings mb-4 md:mb-6 drop-shadow-lg text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Let&apos;s Work Together
        </motion.h2>
        <motion.p
          className="text-text-secondary text-base sm:text-lg mb-6 md:mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          Ready to take your business to the next level? You can{" "}
          <a
            href={consultLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-ncs hover:text-lapis-lazuli underline underline-offset-4"
          >
            book a quick call
          </a>{" "}
          or send details through this form—whatever is easiest. I focus on
          custom websites, web/mobile apps, and automations for local service
          businesses.
        </motion.p>

        <motion.div
          className="bg-rich-black/30 border border-blue-ncs/20 rounded-xl p-4 sm:p-5 mb-6 md:mb-8 text-text-primary text-sm sm:text-base"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <p className="font-semibold text-blue-ncs mb-2">What to include:</p>
          <ul className="list-disc list-inside space-y-2 text-text-secondary">
            <li>Your goal and the problem to solve</li>
            <li>Timeline or launch window</li>
            <li>Budget range and any must-have tools</li>
          </ul>
        </motion.div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 md:space-y-6"
          // Prevent password managers (e.g., LastPass) from injecting extra DOM before hydration
          data-lpignore="true"
          autoComplete="off"
        >
          {/* Name Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <label
              htmlFor="name"
              className="block text-text-primary mb-2 font-medium text-sm sm:text-base"
            >
              Name <span className="text-blue-ncs">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 sm:py-3 rounded-lg bg-rich-black text-text-primary border border-penn-blue focus:border-blue-ncs focus:outline-none transition-all duration-300 text-base"
              placeholder="Your name"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </motion.div>

          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <label
              htmlFor="email"
              className="block text-text-primary mb-2 font-medium text-sm sm:text-base"
            >
              Email <span className="text-blue-ncs">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 sm:py-3 rounded-lg bg-rich-black text-text-primary border border-penn-blue focus:border-blue-ncs focus:outline-none transition-all duration-300 text-base"
              placeholder="your.email@example.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </motion.div>

          {/* Subject Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            viewport={{ once: true }}
          >
            <label
              htmlFor="subject"
              className="block text-text-primary mb-2 font-medium text-sm sm:text-base"
            >
              Subject <span className="text-blue-ncs">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-4 py-3 sm:py-3 rounded-lg bg-rich-black text-text-primary border border-penn-blue focus:border-blue-ncs focus:outline-none transition-all duration-300 text-base"
              placeholder="What's this about?"
              disabled={isSubmitting}
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-400">{errors.subject}</p>
            )}
          </motion.div>

          {/* Message Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <label
              htmlFor="message"
              className="block text-text-primary mb-2 font-medium text-sm sm:text-base"
            >
              Message <span className="text-blue-ncs">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-4 py-3 sm:py-3 rounded-lg bg-rich-black text-text-primary border border-penn-blue focus:border-blue-ncs focus:outline-none transition-all duration-300 resize-y text-base"
              placeholder="Tell me about your project..."
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-400">{errors.message}</p>
            )}
          </motion.div>

          {/* Honeypot Field - Hidden from users, visible to bots */}
          <div
            style={{
              position: "absolute",
              left: "-9999px",
              opacity: 0,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          >
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={formData.website}
              onChange={handleInputChange}
            />
          </div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg hover:bg-lapis-lazuli transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-h-[44px]"
              whileHover={!isSubmitting ? { scale: 1.05, y: -3 } : {}}
              whileTap={!isSubmitting ? { scale: 0.95 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </motion.button>
          </motion.div>

          {/* Status Messages */}
          {submitStatus.type && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg ${
                submitStatus.type === "success"
                  ? "bg-green-900/30 border border-green-500 text-green-200"
                  : "bg-red-900/30 border border-red-500 text-red-200"
              }`}
            >
              <p className="text-center">{submitStatus.message}</p>
            </motion.div>
          )}
        </form>
      </motion.div>
    </motion.section>
  );
}
