"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ChevronLeft, MessageCircle, Mail, Phone, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Support = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <header className="p-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-2xl font-black text-gray-800">AIDE & SUPPORT</h1>
      </header>

      <div className="px-6 space-y-8 pb-10">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-pink-50 p-6 rounded-[32px] text-center space-y-2 cursor-pointer hover:bg-pink-100 transition-colors">
            <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-pink-500 shadow-sm">
              <MessageCircle size={24} />
            </div>
            <p className="font-black text-sm text-pink-600">Chat Live</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-[32px] text-center space-y-2 cursor-pointer hover:bg-purple-100 transition-colors">
            <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-purple-500 shadow-sm">
              <Mail size={24} />
            </div>
            <p className="font-black text-sm text-purple-600">Email</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <HelpCircle size={20} className="text-pink-500" /> Questions Fréquentes
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            <AccordionItem value="item-1" className="border-none bg-white rounded-2xl px-4 shadow-sm">
              <AccordionTrigger className="font-bold text-sm hover:no-underline">Comment vendre mes créations ?</AccordionTrigger>
              <AccordionContent className="text-gray-500 text-xs leading-relaxed">
                Pour devenir vendeur, vous devez avoir un compte certifié et soumettre votre portfolio à notre équipe de modération via l'onglet "Devenir Artiste" dans vos paramètres.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-none bg-white rounded-2xl px-4 shadow-sm">
              <AccordionTrigger className="font-bold text-sm hover:no-underline">Quels sont les délais de livraison ?</AccordionTrigger>
              <AccordionContent className="text-gray-500 text-xs leading-relaxed">
                Les délais varient selon l'artiste, mais comptez généralement 3 à 5 jours ouvrés pour la préparation et 2 à 3 jours pour l'expédition.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-none bg-white rounded-2xl px-4 shadow-sm">
              <AccordionTrigger className="font-bold text-sm hover:no-underline">Puis-je annuler une commande ?</AccordionTrigger>
              <AccordionContent className="text-gray-500 text-xs leading-relaxed">
                Vous pouvez annuler votre commande tant qu'elle n'est pas passée en statut "En préparation". Contactez le support rapidement pour toute demande.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="bg-gray-50 p-6 rounded-[32px] space-y-4">
          <h3 className="font-black text-gray-800">Encore besoin d'aide ?</h3>
          <p className="text-xs text-gray-500 leading-relaxed">Notre équipe est disponible du lundi au vendredi de 9h à 18h pour répondre à toutes vos questions.</p>
          <Button className="w-full rounded-2xl bg-gray-800 hover:bg-gray-900 font-bold">NOUS CONTACTER</Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Support;