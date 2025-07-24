import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { ChatComponent } from './chat/chat.component';
import { MessageComponent } from './message/message.component';
import { InputComponent } from './input/input.component';
import { HeaderComponent } from './header/header.component';
import { MessageContentComponent } from './message-content/message-content.component';
import { VegaChartComponent } from './components/vega-chart/vega-chart.component';
import { VegaTestComponent } from './components/vega-test/vega-test.component';

@NgModule({
  declarations: [
    AppComponent,
    ChatComponent,
    MessageComponent,
    InputComponent,
    HeaderComponent,
    MessageContentComponent,
    VegaChartComponent,
    VegaTestComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    CommonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { } 