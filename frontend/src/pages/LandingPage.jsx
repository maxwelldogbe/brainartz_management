import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Wrench, Twitter, Instagram, Facebook, Linkedin } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import NavBar from '../components/NavBar';
import AdSlot from '../components/AdSlot';
import graphicImg from '../assets/graphic.jpeg';
import largeFormatImg from '../assets/large format.jpeg';
import shirtImg from '../assets/shirt.jpeg';
import photographyImg from '../assets/Forfaits et Services de Photographie.jpeg';
import softwareImg from '../assets/software.jpeg';
import workshopImg from '../assets/workshop.jpeg';

// Small typewriter animated title using framer-motion
const Typewriter = ({ text = '', className = '' }) => {
  const letters = Array.from(text);

  const container = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    },
  };

  const child = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.03 } },
  };

  return (
    <motion.span className={className} variants={container} initial="hidden" animate="visible">
      {letters.map((char, i) => (
        <motion.span key={i} variants={child} className="inline-block">
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
      <motion.span className="inline-block ml-2" aria-hidden="true" animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
        <span className="inline-block w-0.5 h-6 bg-gray-900 align-middle" />
      </motion.span>
    </motion.span>
  );
};

// Data-driven services list — easy to edit or extend
const services = [
  {
    id: 'designing',
    image: graphicImg,
    title: 'Graphic Design',
    features: ['Flyer Design', 'Banner Design', 'Invitations'],
  },
  {
    id: 'printing',
    image: largeFormatImg,
    title: 'Printing',
    features: ['Document printing', 'Banner, Flyer', 'Mugs, Keyholders', 'Business cards', 'Invitation cards'],
  },
  {
    id: 'textiles',
    image: shirtImg,
    title: 'Textiles',
    features: ['Cloth design & printing', 'Shirt printing', ],
  },
  {
    id: 'photography',
    image: photographyImg,
    title: 'Photography',
    features: ['Event photography', 'Videography', 'Picture framing', 'Photobooks',],
  },
  {
    id: 'software',
    image: softwareImg,
    title: 'Software & Web Development',
    features: ['Static Website', 'Web Applications', 'Software Development'],
  },
  {
    id: 'training',
    image: workshopImg,
    title: 'Training & Workshops',
    features: ['One-on-one coaching', 'Group workshops', 'Internship programs'],
  },
];

const ServiceCard = ({ image, title, features = [] }) => (
  // image has a responsive fixed height to avoid layout shifts; card height grows with content
  <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
    <div className="w-full bg-gray-100 flex-shrink-0 overflow-hidden h-28 sm:h-32">
      <img src={image} alt={title} className="object-cover w-full h-full block" loading="lazy" />
    </div>
    <div className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        {features.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
    </div>
  </div>
  );

// Sample works data and a small WorkCard component
const works = [
  {
    id: 'work-1',
    image: graphicImg,
    title: 'Branding for Cafe Lumière',
    desc: 'Logo, business cards and shop signage designed for a local cafe.',
  },
  {
    id: 'work-2',
    image: largeFormatImg,
    title: 'Event Banners & Stands',
    desc: 'Large-format banners and roll-ups for a 3-day trade expo.',
  },
  {
    id: 'work-3',
    image: shirtImg,
    title: 'Branded Apparel',
    desc: 'Custom shirt design and bulk printing for a community event.',
  },
  {
    id: 'work-4',
    image: photographyImg,
    title: 'Event Photography',
    desc: 'End-to-end photography and post-processing for weddings and corporate events.',
  },
];

// Social links data (used as props for SocialCard)
const socialLinks = [
  // { id: 'twitter', href: '#', Icon: Twitter, label: 'Twitter' },
  // { id: 'instagram', href: '#', Icon: Instagram, label: 'Instagram' },
  { id: 'facebook', href: '#', Icon: Facebook, label: 'Facebook' },
  { id: 'linkedin', href: '#', Icon: Linkedin, label: 'LinkedIn' },
  { id: 'whatsapp', href: '#', Icon: FaWhatsapp, label: 'WhatsApp' },
];

const WorkCard = ({ image, title, desc }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="w-full h-40 bg-gray-100 overflow-hidden">
      <img src={image} alt={title} className="object-cover w-full h-full" loading="lazy" />
    </div>
    <div className="p-4">
      <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  </div>
);

// Social card component - receives links via props
const SocialCard = ({ title = 'Social Media', description = '', links = [] }) => (
  <div className="bg-white/80 text-gray-900 p-4 rounded-lg backdrop-blur-sm text-center">
    <h4 className="text-lg font-semibold mb-1">{title}</h4>
    <p className="text-sm opacity-90">{description}</p><br/>
    <div className="flex items-center justify-center space-x-4 mb-5">
      {links.map((l) => (
        <a key={l.id} href={l.href} aria-label={l.label} className="text-gray-900 hover:text-blue-500">
          <l.Icon className="h-6 w-6" />
        </a>
      ))}
    </div>
  </div>
);

const LandingPage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [typewriterKey, setTypewriterKey] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowPopup(true), 5000); // 5 seconds
    return () => clearTimeout(t);
  }, []);

  // When popup is shown, remount the Typewriter periodically so the typing animation restarts.
  useEffect(() => {
    if (!showPopup) return undefined;
    // Rough loop interval: 4s (adjustable). This causes the Typewriter to remount and replay.
    const interval = setInterval(() => setTypewriterKey((k) => k + 1), 4000);
    return () => clearInterval(interval);
  }, [showPopup]);

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* NavBar (moved to its own component so it doesn't scroll with the page) */}
      <NavBar />

      {/* Hero Section - background image is set on the section and the only div inside is the animated card */}
      <section
        className="w-full py-20 relative h-64 md:h-96 lg:h-[28rem] overflow-hidden bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{ backgroundImage: `url(${photographyImg})` }}
        role="img"
        aria-label="BrainArtz hero background"
      >
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={showPopup ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pointer-events-auto w-full max-w-2xl mx-4 bg-white/30 backdrop-blur-md border border-white/20 rounded-xl p-8 shadow-xl"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-0 text-center" aria-label="Professional Services You Can Trust">
              <Typewriter key={typewriterKey} text="The home of creativity....." />
            </h2>
          </motion.div>
        )}
      </section>
      

      {/* Our Work Section (moved below Services & About) */}

      {/* Services Section */}
      <section id="services" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Services</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s) => (
              <ServiceCard key={s.id} image={s.image} title={s.title} features={s.features} />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <h3 className="text-4xl font-bold text-gray-900 mb-6">About BrainArtz</h3>
              <p className="text-lg text-gray-600 mb-4">
                BrainArtz is a trusted service provider committed to excellence in every project we undertake.
                With years of experience and a team of skilled professionals, we deliver results that exceed expectations.
              </p>
              <p className="text-lg text-gray-600 mb-4">
                Our mission is to provide top-quality services with integrity, professionalism, and attention to detail.
                We take pride in building lasting relationships with our clients through exceptional service delivery.
              </p>
              <p className="text-lg text-gray-600">
                Whether you need repairs, custom solutions, or professional consultation, BrainArtz is your partner for success.
              </p>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h4 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Us?</h4>
                <ul className="space-y-4">
                  <li className="flex items-start"><span className="text-blue-600 mr-3 text-xl">•</span><span className="text-gray-700">Experienced and certified professionals</span></li>
                  <li className="flex items-start"><span className="text-blue-600 mr-3 text-xl">•</span><span className="text-gray-700">Customer satisfaction is our priority</span></li>
                  <li className="flex items-start"><span className="text-blue-600 mr-3 text-xl">•</span><span className="text-gray-700">Transparent pricing and communication</span></li>
                  <li className="flex items-start"><span className="text-blue-600 mr-3 text-xl">•</span><span className="text-gray-700">Quality materials and workmanship</span></li>
                  <li className="flex items-start"><span className="text-blue-600 mr-3 text-xl">•</span><span className="text-gray-700">Reliable and timely service delivery</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      {/* Our Work Section
      <section id="works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Work</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {works.map((w) => (
              <WorkCard key={w.id} image={w.image} title={w.title} desc={w.desc} />
            ))}
          </div>
        </div>
      </section> */}
      <section id="contact" className="py-12 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl sm:text-4xl font-bold text-center mb-8">Get In Touch</h3>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Social Media Card (now a component) */}
            <SocialCard title="Social Media" description="Follow us for updates, promotions and behind-the-scenes." links={socialLinks} />

            {/* Direct Message Card */}
            <div className="bg-white/80 text-gray-900 p-4 rounded-lg backdrop-blur-sm text-center">
              {/* <Phone className="h-8 w-8 mx-auto mb-3 text-gray-900" /> */}
              <h4 className="text-lg font-semibold mb-1">Direct Contact</h4>
              <p className="text-base mb-1"><a href="tel:+233544074731" className="underline text-blue-600">+233 544 074 731</a></p>
              <p className="text-base mb-1"><a href="tel:+233201023135" className="underline text-blue-600">+233 201 023 135</a></p>
              <p className="text-base"><a href="mailto:info@brainartz.com" className="underline text-blue-600">info@brainartz.com</a></p>
              <p className="text-sm opacity-80 mt-1">Mon-Sat: 8AM - 6PM</p>
            </div>

            {/* Address Card */}
            <div className="bg-white/80 text-gray-900 p-4 rounded-lg backdrop-blur-sm text-center">
              <MapPin className="h-8 w-8 mx-auto mb-3 text-gray-900" />
              <h4 className="text-lg font-semibold mb-1">Sogakope, Ghana</h4>
              <p className="text-base mb-1">You can walk into our office.</p>
              <p className="text-sm opacity-80"> Directly opposite Holy Cross Catholic Church. Off the John Miller Street</p>
            </div>
          </div>

          {/* <div className="mt-8 text-center">
            <p className="text-lg mb-2">Ready to start your project?</p>
            <p className="text-sm opacity-90">Contact us today for a free consultation and quote. We're here to help bring your vision to life.</p>
          </div> */}
        </div>
      </section>

      {/* Footer-ad placeholder: small responsive ad area above footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
        <AdSlot id="ads-footer" variant="small" />
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} BrainArtz. All rights reserved.</p>
          <p className="mt-2 text-sm">Professional Services | Quality Workmanship | Customer Satisfaction</p>
        </div>
      </footer>
    </div>
  );
};

const ContactCard = ({ icon, title, info, subtitle }) => (
  <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
    {icon}
    <h4 className="text-xl font-bold mb-2">{title}</h4>
    <p className="text-lg mb-1">{info}</p>
    <p className="text-sm opacity-80">{subtitle}</p>
  </div>
);

export default LandingPage;
