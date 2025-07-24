import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-vega-test',
  template: `
    <div class="vega-test">
      <h2>Vega Chart Test</h2>
      
      <div class="test-section">
        <h3>Test 1: Simple Bar Chart</h3>
        <app-vega-chart 
          [spec]="simpleBarSpec" 
          [data]="simpleBarData"
          [width]="600"
          [height]="400">
        </app-vega-chart>
      </div>

      <div class="test-section">
        <h3>Test 2: Chart with Data in Spec</h3>
        <app-vega-chart 
          [spec]="specWithData" 
          [width]="600"
          [height]="400">
        </app-vega-chart>
      </div>

      <div class="test-section">
        <h3>Test 3: Chart with External Data</h3>
        <app-vega-chart 
          [spec]="specWithoutData" 
          [data]="externalData"
          [width]="600"
          [height]="400">
        </app-vega-chart>
      </div>

      <div class="test-section">
        <h3>Test 4: Visualization Message Format</h3>
        <app-message-content 
          [type]="'visualization'" 
          [data]="visualizationMessage">
        </app-message-content>
      </div>

      <div class="test-section">
        <h3>Test 5: User's Vega-Lite Spec (Direct)</h3>
        <app-vega-chart 
          [spec]="userVegaLiteSpec" 
          [width]="800"
          [height]="500">
        </app-vega-chart>
      </div>

      <div class="test-section">
        <h3>Test 6: User's Vega-Lite Spec (Message Format)</h3>
        <app-message-content 
          [type]="'visualization'" 
          [data]="userVisualizationMessage">
        </app-message-content>
      </div>
    </div>
  `,
  styles: [`
    .vega-test {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .test-section {
      margin-bottom: 40px;
      border: 1px solid var(--vscode-input-border);
      border-radius: 8px;
      padding: 20px;
      background-color: var(--vscode-editor-background);
    }

    .test-section h3 {
      margin-top: 0;
      margin-bottom: 15px;
      color: var(--vscode-editor-foreground);
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 8px;
    }
  `]
})
export class VegaTestComponent implements OnInit {
  
  simpleBarData = [
    { category: 'A', value: 10 },
    { category: 'B', value: 20 },
    { category: 'C', value: 15 }
  ];

  simpleBarSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    height: 300,
    title: 'Simple Bar Chart',
    mark: 'bar',
    encoding: {
      x: { field: 'category', type: 'nominal' },
      y: { field: 'value', type: 'quantitative' }
    }
  };

  specWithData = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    height: 300,
    title: 'Chart with Data in Spec',
    data: {
      values: [
        { x: 'X', y: 5 },
        { x: 'Y', y: 8 },
        { x: 'Z', y: 12 }
      ]
    },
    mark: 'bar',
    encoding: {
      x: { field: 'x', type: 'nominal' },
      y: { field: 'y', type: 'quantitative' }
    }
  };

  specWithoutData = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    height: 300,
    title: 'Chart with External Data',
    mark: 'bar',
    encoding: {
      x: { field: 'name', type: 'nominal' },
      y: { field: 'count', type: 'quantitative' }
    }
  };

  externalData = [
    { name: 'Item 1', count: 25 },
    { name: 'Item 2', count: 30 },
    { name: 'Item 3', count: 18 }
  ];

  visualizationMessage = {
    title: 'Test Visualization',
    description: 'This is a test visualization message',
    vegaLiteSpec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 600,
      height: 400,
      title: 'Test Visualization',
      data: {
        values: [
          { group: 'Group A', value: 100 },
          { group: 'Group B', value: 150 },
          { group: 'Group C', value: 80 }
        ]
      },
      mark: 'bar',
      encoding: {
        x: { field: 'group', type: 'nominal' },
        y: { field: 'value', type: 'quantitative' }
      }
    }
  };

  userVegaLiteSpec = {
    "data": {
      "values": [
        {"acceleration": 24.8, "car_name": "peugeot 504"},
        {"acceleration": 24.6, "car_name": "vw pickup"},
        {"acceleration": 23.7, "car_name": "vw dasher (diesel)"},
        {"acceleration": 23.5, "car_name": "volkswagen type 3"},
        {"acceleration": 22.2, "car_name": "oldsmobile cutlass salon brougham"},
        {"acceleration": 22.2, "car_name": "chevrolet chevette"},
        {"acceleration": 22.1, "car_name": "chevrolet woody"},
        {"acceleration": 21.9, "car_name": "peugeot 504"},
        {"acceleration": 21.8, "car_name": "mercedes-benz 240d"},
        {"acceleration": 21.7, "car_name": "vw rabbit c (diesel)"}
      ]
    },
    "encoding": {
      "x": {
        "axis": {"labelOverlap": true},
        "field": "car_name",
        "sort": {"field": "acceleration", "order": "descending"},
        "title": "Car Name",
        "type": "nominal"
      },
      "y": {
        "axis": {"labelOverlap": true},
        "field": "acceleration",
        "sort": {},
        "title": "Acceleration",
        "type": "quantitative"
      }
    },
    "mark": {"tooltip": true, "type": "bar"},
    "title": "Top 10 Cars by Acceleration",
    "transform": [
      {"sort": [{"field": "acceleration", "order": "descending"}], "window": [{"as": "rank", "op": "rank"}]},
      {"filter": "datum.rank <= 10"}
    ]
  };

  userVisualizationMessage = {
    title: 'Top 10 Cars by Acceleration',
    description: 'Bar chart showing the top 10 cars by acceleration time',
    vegaLiteSpec: {
      "data": {
        "values": [
          {"acceleration": 24.8, "car_name": "peugeot 504"},
          {"acceleration": 24.6, "car_name": "vw pickup"},
          {"acceleration": 23.7, "car_name": "vw dasher (diesel)"},
          {"acceleration": 23.5, "car_name": "volkswagen type 3"},
          {"acceleration": 22.2, "car_name": "oldsmobile cutlass salon brougham"},
          {"acceleration": 22.2, "car_name": "chevrolet chevette"},
          {"acceleration": 22.1, "car_name": "chevrolet woody"},
          {"acceleration": 21.9, "car_name": "peugeot 504"},
          {"acceleration": 21.8, "car_name": "mercedes-benz 240d"},
          {"acceleration": 21.7, "car_name": "vw rabbit c (diesel)"}
        ]
      },
      "encoding": {
        "x": {
          "axis": {"labelOverlap": true},
          "field": "car_name",
          "sort": {"field": "acceleration", "order": "descending"},
          "title": "Car Name",
          "type": "nominal"
        },
        "y": {
          "axis": {"labelOverlap": true},
          "field": "acceleration",
          "sort": {},
          "title": "Acceleration",
          "type": "quantitative"
        }
      },
      "mark": {"tooltip": true, "type": "bar"},
      "title": "Top 10 Cars by Acceleration",
      "transform": [
        {"sort": [{"field": "acceleration", "order": "descending"}], "window": [{"as": "rank", "op": "rank"}]},
        {"filter": "datum.rank <= 10"}
      ]
    }
  };

  ngOnInit() {
    console.log('[VegaTestComponent] Test component initialized');
    console.log('[VegaTestComponent] Test data:', {
      simpleBarData: this.simpleBarData,
      specWithData: this.specWithData,
      specWithoutData: this.specWithoutData,
      externalData: this.externalData,
      visualizationMessage: this.visualizationMessage,
      userVegaLiteSpec: this.userVegaLiteSpec,
      userVisualizationMessage: this.userVisualizationMessage
    });
  }
} 