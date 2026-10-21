import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProjektDetailPage } from './projekt-detail.page';

const routes: Routes = [
  {
    path: '',
    component: ProjektDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjektDetailPageRoutingModule {}
