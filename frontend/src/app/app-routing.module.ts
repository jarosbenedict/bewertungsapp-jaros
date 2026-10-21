import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    // Startseite ist die Projektliste
    path: '',
    redirectTo: 'projekte',
    pathMatch: 'full',
  },
  {
    path: 'projekte',
    loadChildren: () =>
      import('./pages/projekte-liste/projekte-liste.module').then((m) => m.ProjekteListePageModule),
  },
  {
    // Detailansicht mit Routenparameter, wie im Kursbeispiel /buch-detail/:id
    path: 'projekte/:id',
    loadChildren: () =>
      import('./pages/projekt-detail/projekt-detail.module').then((m) => m.ProjektDetailPageModule),
  },
  {
    // Unbekannte Pfade zurück auf die Liste
    path: '**',
    redirectTo: 'projekte',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
