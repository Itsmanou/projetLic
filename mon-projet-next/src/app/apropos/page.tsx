"use client";

import React from "react";
import Image from 'next/image';
import Link from 'next/link';
import { motion } from "framer-motion";
import Navbar from '@/app/components/Navbar/Navbar';
import Footer from '@/app/components/Footer/Footer';

const Apropos = () => {
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto text-gray-800">

        {/* Hero animé avec scroll */}
        <motion.section
          className="w-full h-64 mt-4 bg-gradient-to-r from-blue-700 to-blue-500 flex items-center justify-center shadow-lg"
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl font-bold text-white text-center tracking-wide">
            À Propos de PharmaShop
          </h1>
        </motion.section>

        {/* Notre histoire avec scroll */}
        <motion.section
          className="mb-16 text-center px-4 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-semibold mb-6 mt-12 text-blue-700">Notre Histoire</h2>
          <p className="text-lg leading-relaxed text-gray-700 shadow-md p-4 bg-blue-50">
            Fondée en 2025, <strong>PharmaShop</strong> est né de l'envie de rendre les produits pharmaceutiques accessibles à tous.
          </p>
        </motion.section>

        {/* Notre mission avec scroll et image sans bords arrondis */}
        <motion.section
          className="mb-16 flex flex-col md:flex-row items-center gap-6 bg-blue-100 py-16 px-6 md:px-16 shadow-xl"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <motion.div
            className="md:w-1/2 flex justify-center"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src="/images/pharmacy-hero-1.png"
              alt="Notre mission"
              width={500}
              height={400}
              className="shadow-2xl object-cover border-4 "
            />
          </motion.div>

          <div className="md:w-1/2 text-justify md:pt-4">
            <h2 className="text-4xl font-semibold mb-6 text-blue-700">Notre Mission</h2>
            <p className="text-lg leading-relaxed mb-4 text-gray-700">
              Chez <strong>PharmaShop</strong>, notre mission est de faciliter l'accès aux produits de santé essentiels à travers un service en ligne sécurisé.
            </p>
            <p className="text-lg leading-relaxed text-gray-600">Nous croyons en une santé pour tous.</p>
          </div>
        </motion.section>

        {/* Bouton Contact avec effet de zoom */}
        <motion.div
          className="text-center mt-12 mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/contact">
            <button className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg hover:scale-110 transition transform shadow-lg font-semibold text-lg">
              Contactez-nous
            </button>
          </Link>
        </motion.div>

      </div>
      <Footer />
    </>
  );
};

export default Apropos;
