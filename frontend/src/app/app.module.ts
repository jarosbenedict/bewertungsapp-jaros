import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular/lazy';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Stellt HttpClient für den ApiService bereit.
    // Ab Angular 18 ist HttpClientModule veraltet, provideHttpClient() ist der
    // aktuelle Weg. Funktional identisch zu HttpClientModule aus der Kursvorlage.
    provideHttpClient(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
