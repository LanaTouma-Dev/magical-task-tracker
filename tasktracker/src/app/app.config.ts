import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  LucideAngularModule,
  Search, Pencil, X, Trophy, Sword, Scroll,
  FlaskConical, SlidersHorizontal, Skull, Flame,
  Zap, Sparkles, WandSparkles, Star, BookOpen,
  ClipboardList, ShieldCheck, CircleX
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(LucideAngularModule.pick({
      Search, Pencil, X, Trophy, Sword, Scroll,
      FlaskConical, SlidersHorizontal, Skull, Flame,
      Zap, Sparkles, WandSparkles, Star, BookOpen,
      ClipboardList, ShieldCheck, CircleX
    })),
  ]
};
