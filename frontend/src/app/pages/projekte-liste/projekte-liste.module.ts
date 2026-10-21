import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { ProjekteListePageRoutingModule } from './projekte-liste-routing.module';

import { ProjekteListePage } from './projekte-liste.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProjekteListePageRoutingModule
  ],
  declarations: [ProjekteListePage]
})
export class ProjekteListePageModule {}
