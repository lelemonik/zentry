import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePersistedState } from '@/hooks/use-local-storage';

// Language translations
export const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    tasks: 'Tasks',
    notes: 'Notes',
    schedule: 'Schedule',
    profile: 'Profile',
    settings: 'Settings',
    
    // Common actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    create: 'Create',
    update: 'Update',
    
    // Tasks
    newTask: 'New Task',
    taskTitle: 'Task Title',
    taskDescription: 'Task Description',
    dueDate: 'Due Date',
    priority: 'Priority',
    completed: 'Completed',
    pending: 'Pending',
    
    // Notes
    newNote: 'New Note',
    noteTitle: 'Note Title',
    noteContent: 'Note Content',
    
    // Schedule
    newEvent: 'New Event',
    eventTitle: 'Event Title',
    eventLocation: 'Location',
    startTime: 'Start Time',
    endTime: 'End Time',
    
    // Settings
    preferences: 'Preferences & Settings',
    notifications: 'Notifications',
    language: 'Language',
    fontSize: 'Font Size',
    theme: 'Theme',
    
    // Auth
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    
    // Profile
    displayName: 'Display Name',
    bio: 'Bio',
    location: 'Location',
    website: 'Website',
    phone: 'Phone'
  },
  
  es: {
    // Navigation
    dashboard: 'Tablero',
    tasks: 'Tareas',
    notes: 'Notas',
    schedule: 'Horario',
    profile: 'Perfil',
    settings: 'Configuración',
    
    // Common actions
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Añadir',
    create: 'Crear',
    update: 'Actualizar',
    
    // Tasks
    newTask: 'Nueva Tarea',
    taskTitle: 'Título de la Tarea',
    taskDescription: 'Descripción de la Tarea',
    dueDate: 'Fecha de Vencimiento',
    priority: 'Prioridad',
    completed: 'Completado',
    pending: 'Pendiente',
    
    // Notes
    newNote: 'Nueva Nota',
    noteTitle: 'Título de la Nota',
    noteContent: 'Contenido de la Nota',
    
    // Schedule
    newEvent: 'Nuevo Evento',
    eventTitle: 'Título del Evento',
    eventLocation: 'Ubicación',
    startTime: 'Hora de Inicio',
    endTime: 'Hora de Fin',
    
    // Settings
    preferences: 'Preferencias y Configuración',
    notifications: 'Notificaciones',
    language: 'Idioma',
    fontSize: 'Tamaño de Fuente',
    theme: 'Tema',
    
    // Auth
    signIn: 'Iniciar Sesión',
    signOut: 'Cerrar Sesión',
    signUp: 'Registrarse',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    
    // Profile
    displayName: 'Nombre para Mostrar',
    bio: 'Biografía',
    location: 'Ubicación',
    website: 'Sitio Web',
    phone: 'Teléfono'
  },
  
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    tasks: 'Tâches',
    notes: 'Notes',
    schedule: 'Horaire',
    profile: 'Profil',
    settings: 'Paramètres',
    
    // Common actions
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    create: 'Créer',
    update: 'Mettre à jour',
    
    // Tasks
    newTask: 'Nouvelle Tâche',
    taskTitle: 'Titre de la Tâche',
    taskDescription: 'Description de la Tâche',
    dueDate: 'Date d\'échéance',
    priority: 'Priorité',
    completed: 'Terminé',
    pending: 'En attente',
    
    // Notes
    newNote: 'Nouvelle Note',
    noteTitle: 'Titre de la Note',
    noteContent: 'Contenu de la Note',
    
    // Schedule
    newEvent: 'Nouvel Événement',
    eventTitle: 'Titre de l\'Événement',
    eventLocation: 'Lieu',
    startTime: 'Heure de Début',
    endTime: 'Heure de Fin',
    
    // Settings
    preferences: 'Préférences et Paramètres',
    notifications: 'Notifications',
    language: 'Langue',
    fontSize: 'Taille de Police',
    theme: 'Thème',
    
    // Auth
    signIn: 'Se Connecter',
    signOut: 'Se Déconnecter',
    signUp: 'S\'inscrire',
    email: 'E-mail',
    password: 'Mot de passe',
    
    // Profile
    displayName: 'Nom d\'affichage',
    bio: 'Biographie',
    location: 'Emplacement',
    website: 'Site Web',
    phone: 'Téléphone'
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  availableLanguages: { code: Language; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const availableLanguages = [
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt' as Language, name: 'Português', flag: '🇧🇷' },
  { code: 'it' as Language, name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja' as Language, name: '日本語', flag: '🇯🇵' },
  { code: 'ko' as Language, name: '한국어', flag: '🇰🇷' },
  { code: 'zh' as Language, name: '中文', flag: '🇨🇳' }
];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = usePersistedState<Language>('appLanguage', 'en');

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  // Apply language to document
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    availableLanguages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}