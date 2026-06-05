import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  LucideAngularModule,
  Search, Pencil, X, Trophy, Sword, Scroll,
  FlaskConical, SlidersHorizontal, Skull, Flame,
  Zap, Sparkles, WandSparkles, Star, BookOpen,
  ClipboardList, ShieldCheck, CircleX,
  Check, CircleCheck, CircleDashed, Loader, Target, RotateCcw, Plus,
  Download, Upload
} from 'lucide-angular';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(LucideAngularModule.pick({
      Search, Pencil, X, Trophy, Sword, Scroll,
      FlaskConical, SlidersHorizontal, Skull, Flame,
      Zap, Sparkles, WandSparkles, Star, BookOpen,
      ClipboardList, ShieldCheck, CircleX,
      Check, CircleCheck, CircleDashed, Loader, Target, RotateCcw, Plus,
      Download, Upload
    })), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
  ]
};
