import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProjekteListePage } from './projekte-liste.page';

const routes: Routes = [
  {
    path: '',
    component: ProjekteListePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjekteListePageRoutingModule {}
