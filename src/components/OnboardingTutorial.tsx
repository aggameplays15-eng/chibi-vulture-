"use client";

import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Sparkles, ShoppingBag, Users, MessageSquare, Palette, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  action?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "Bienvenue sur Chibi Vulture !",
    description: "Le réseau social artistique où tu peux partager tes créations, acheter des produits uniques et connecter avec d'autres artistes.",
    icon: Sparkles,
  },
  {
    id: 2,
    title: "Explore le Feed",
    description: "Découvrez les créations des autres artistes, likez, commentez et suivez vos créateurs préférés.",
    icon: Palette,
    action: "feed",
  },
  {
    id: 3,
    title: "Boutique Chibi",
    description: "Parcourez notre catalogue de produits exclusifs, ajoutez au panier et passez commande avec livraison.",
    icon: ShoppingBag,
    action: "shop",
  },
  {
    id: 4,
    title: "Communauté",
    description: "Connectez-vous avec d'autres artistes, envoyez des messages et participez aux conversations.",
    icon: Users,
    action: "messages",
  },
  {
    id: 5,
    title: "C'est parti !",
    description: "Vous êtes prêt à explorer Chibi Vulture. Commencez par créer votre profil personnalisé.",
    icon: Check,
  },
];

const OnboardingTutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isSkipped, setIsSkipped] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has already seen the tutorial
    const hasSeenTutorial = localStorage.getItem('cv_tutorial_seen');
    if (hasSeenTutorial) {
      setIsVisible(false);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    setIsSkipped(true);
    localStorage.setItem('cv_tutorial_seen', 'true');
    setIsVisible(false);
  };

  const handleComplete = () => {
    localStorage.setItem('cv_tutorial_seen', 'true');
    setIsVisible(false);
  };

  const handleAction = (action?: string) => {
    if (action) {
      navigate(`/${action}`);
    }
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
        <CardContent className="p-8 space-y-6">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              <Icon size={36} className="text-purple-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-black text-gray-900">{step.title}</h2>
            <p className="text-gray-500 font-medium leading-relaxed">{step.description}</p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep ? 'w-6 bg-purple-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Action Button */}
          <Button
            onClick={() => {
              handleNext();
              handleAction(step.action);
            }}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-black text-lg shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Commencer' : 'Suivant'}
            {currentStep < tutorialSteps.length - 1 && <ArrowRight size={18} />}
          </Button>

          {/* Skip Link */}
          {currentStep < tutorialSteps.length - 1 && (
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors"
            >
              Passer le tutoriel
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingTutorial;
