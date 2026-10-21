import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { ProjektDetailPageRoutingModule } from './projekt-detail-routing.module';

import { ProjektDetailPage } from './projekt-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProjektDetailPageRoutingModule
  ],
  declarations: [ProjektDetailPage]
})
export class ProjektDetailPageModule {}
