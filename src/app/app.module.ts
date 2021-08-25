import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { SpeakTextComponent } from './speak-text/speak-text.component';
import { MQCurrencyDirective } from './directives/currency-formatter.directive';
import { CloneTextComponent } from './clone-text/clone-text.component';

@NgModule({
  declarations: [
    MQCurrencyDirective,
    AppComponent,
    SpeakTextComponent,
    CloneTextComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
