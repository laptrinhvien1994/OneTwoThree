import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { SpeakTextComponent } from './speak-text/speak-text.component';
import { MQCurrencyDirective } from './directives/currency-formatter.directive';

@NgModule({
  declarations: [
    MQCurrencyDirective,
    AppComponent,
    SpeakTextComponent,

  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
