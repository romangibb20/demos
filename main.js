require([
        "dojo/on",
        "esri/Map",
        "esri/views/SceneView",
        "esri/widgets/Expand",
        "esri/widgets/Search",
        "esri/tasks/Locator",
        "esri/Camera",
        "esri/geometry/geometryEngine",
        "esri/Graphic",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/widgets/Sketch/SketchViewModel",
        "esri/layers/GraphicsLayer",
      ], function(on, Map, SceneView, Expand, Search, Locator, Camera, geometryEngine, Graphic, SimpleFillSymbol, SimpleLineSymbol, SketchViewModel, GraphicsLayer) {
  
        var searchExpand, solarExpand, sketchViewModel, panelGraphic;
        var drawButton = document.getElementById("drawButton");
        var calcButton = document.getElementById("calcButton");
  
        <!-- ***** SETUP WIDGETS AND DISPLAY ***** !-->
      
        // Use an ESRI basemap
        var map = new Map({
          basemap: "hybrid",
          ground: "world-elevation"
        });

        // Create a 3D view
        var view = new SceneView({
          container: "viewDiv",
          map: map,
          camera: new Camera({
            position: [-100.4593, 16.9014, 5500000],
            heading: 10.53,
            tilt: 20
          })
        });
  
        // Use a graphics layer for drawing polygons/panels
        var graphicsLayer = new GraphicsLayer({
          id: "sp",
          title: "Solar Panels",
          visible: true
        });
        map.add(graphicsLayer);
        
        // Use ESRI's world geocoder to locate addresses
        // but limit results to US addresses only as per spec
        var locatorUrl = "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/";
  
        var usLocator = new Locator({
              url: locatorUrl
        });
   
        // Use the search widget with source set to locator
        var searchWidget = new Search({
          view: view,
          popupEnabled: false,
          sources: [{
            locator: usLocator,
            countryCode: "US",
            placeholder: "Enter a US address"
          }],
          includeDefaultSources: false 
        });
   
        // Add search and calculator functionality 
        // to Expand widget to reduce clutter
  
        searchExpand = new Expand({
          expandIconClass: "esri-icon-search",
          expandTooltip: "Expand Search",
          expanded: false,
          view: view,
          group: "top-right",
          content: searchWidget
        });
  
        solarExpand = new Expand({
          expandIconClass: "esri-icon-polygon",
          expandTooltip: "Expand Solar Calculator",
          expanded: false,
          view: view,
          group: "top-right",
          content: document.getElementById("npArea"),
        });

        // Add the expand widget to the top right corner of the view
        view.ui.add([searchExpand, solarExpand], "top-right"); 
  
        <!-- ***** SETUP LISTENERS AND HANDLERS ***** !-->
  
        view.when(function() { //callback when the view renders

          // Listeners 
          drawButton.addEventListener("click", drawPanels);
          calcButton.addEventListener("click", calcNominalPower);
          
          // Set up sketchviewmodel for drawing panel polygons
          sketchViewModel = new SketchViewModel({
            view: view,
            layer: graphicsLayer,
            updateOnGraphicClick: true,
            defaultUpdateOptions: {
              toggleToolOnClick: false
            }
          });
          
          // when the user double clicks to complet the
          // polygon, head to createPanel
          sketchViewModel.on("create", createPanel);
              
          // 'delete' is fired as part of an update event
          sketchViewModel.on("update", deletePanel);
                
        });
  
        <!-- ***** FUNCTIONS ***** !-->
                
        // the Draw Panel button was clicked
        function drawPanels(event) {
          
          // Remove any previous panels
          sketchViewModel.cancel();
          graphicsLayer.removeAll();
          panelGraphic = undefined;
          
          // Hide the previous results
          document.getElementById("resultArea").style.display = "none";
          document.getElementById("npArea").style.height = "270px";
          
          // Let the widget handle drawing
          sketchViewModel.create("polygon"); 
        }

        // The drawing operation ended with a 
        // double click
        function createPanel(event) {     
          
          if (event.state === "complete") {
            
            // Setup the 3D symbol. Get the height from the input
            var symbol = {
              type: "polygon-3d",  
              symbolLayers: [{
                type: "extrude",  
                size: document.getElementById("heightInput").value,  // height
                material: { color: "blue" }
              }]
            };
            
            // Graphic objects contain geometry and symbols
            // create and add to the graphics layer
            panelGraphic = new Graphic({
              geometry: event.graphic.geometry,
              symbol: symbol
            });       
            graphicsLayer.graphics.add(panelGraphic);

            // Calculate nominal power. panelGraphic is global so 
            // no parameters here
            calcNominalPower();
            
          } 
        }
  
        // User selected a polygon and clicked
        // on delete key
        function deletePanel(event) {

          if (event.state === "cancel") {
                 
            //Hide the previous results
            document.getElementById("resultArea").style.display = "none";
            document.getElementById("npArea").style.height = "270px";
            
            //Remove the sketch graphic
            sketchViewModel.delete();
          }
        }
  
        // Function to calculate Nominal Power
        // E = A x r x H x PR
        // E: Energy (kWh)
        // A: total Area of the panel (m²)
        // r is solar panel yield (%)
        // H is annual average solar radiation on tilted panels
        // PR = Performance ratio
        // Assumptions/Sources for nominal power calculation:
        // 1) The annual average (H) is 10857.75 MJ/m2 according to 
        //    http://www.opensolardb.org/db/extractcopypaste. This 
        //    equates to 3016kWh. Assumptions are optimal tilt
        //    and constant radiation density across US territories.
        // 2) Solar panel yeild (r) is assumed to be 15%. Standard test 
        //    conditions (STC) are assumed: radiation=1000 W/m2, 
        //    cell temperature=25C, Wind speed=1 m/s, Air Mass=1.5
        // 3) Performance ratio (PR) equates to .75 and was calculated
        //    as the product of 1 - the loss details assumed below:
        //    Inverter losses (6% to 15 %) = 8%
        //    Temperature losses (5% to 15%) = 8%
        //    DC cables losses (1 to 3 %) = 2%
        //    AC cables losses (1 to 3 %) = 2%
        //    Shadings  0 % to 40% (depends of site) = 3%
        //    Losses weak irradiation 3% to 7% = 3%
        //    Losses due to dust, snow... (2%) = 2%
        //    Other Losses = 0%
        //    source: https://photovoltaic-software.com/principle-ressources/how-calculate-solar-energy-power-pv-systems
        function calcNominalPower (){
          
          if (panelGraphic == undefined){ //when a new graphic is being drawn or when the application loads
            alert("Please draw a panel first");
            return;
          }
             
          // Planar area
          var pArea = geometryEngine.planarArea(geometryEngine.simplify(panelGraphic.geometry), "square-meters"); 
                   
          if (pArea>100000){ //messes with the display, not intended use. 
            alert("Please zoom to rooftop levels");
            return;
          }
                        
          // surface area as per tilt (orientation has no impact)     
          var tilt = document.getElementById("tiltInput").value;
          
          if (tilt>89){ 
            alert("Please enter a tilt less than 90 degrees");
            return;
          }
          
          // Leaving this here since spec requested information be 
          // collected. not used to calculate surface area using 
          // Area/Cos(angle) formula
          
          /*var azimuth;       
          switch(document.getElementById("orientationInput").value) {
            case "North":
              azimuth = 0;
              break;
            case "East":
              azimuth = 90;
              break;
            case "South":
              azimuth = 180;
              break;
            case "West":
              azimuth = 270;
              break;
          }*/
          
          // Calculate the surface area under the planar polygon
          var sArea = calcSurfaceArea(pArea, tilt)
          
          // Use the surface area in nominal power calculation
          var nPower = sArea * .15 * 3016 * .75;
          
          // Format things for display
          var unit 
          if (nPower > 1000000){
            unit = "GWh/yr";
            nPower = nPower / 1000000;
          } else if (nPower > 1000) {
            unit = "MWh/yr";
            nPower = nPower / 1000;
          } else
            {
              unit = "kWh/yr";
            }
          var nPowerFmt = nPower.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
          var paFmt = pArea.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
          var saFmt = sArea.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
            
          // Show the results
          document.getElementById("npResult").innerHTML = nPowerFmt + " " + unit;
          document.getElementById("paResult").innerHTML = paFmt + " sqm";
          document.getElementById("saResult").innerHTML = saFmt + " sqm";
          
          document.getElementById("resultArea").style.display = "block";
          document.getElementById("npArea").style.height = "385px";
             
          // Redraw the polygon in case the height was changed
          // This could be better organized or done only if it was changed
          refreshSymbol();
          
        }
 
        function calcSurfaceArea(pArea, tilt) {
          
          //convert deg to rad as cos function expects rad
          var pi = Math.PI;
          var tiltRad = tilt * (pi/180);
         
          // Formula below
          // http://www.innovativegis.com/basis/Supplements/BM_Dec_02/Surface_Area3.htm
          
          var sArea = pArea / Math.cos(tiltRad);
          return sArea;
          
        }
  
        // Redraw the panel when recalculating
        function refreshSymbol(){
        
          var symbol = {
            type: "polygon-3d",  
            symbolLayers: [{
              type: "extrude",  
              size: document.getElementById("heightInput").value,  // height
              material: { color: "blue" }
            }]
          };

          // Get the previous geometry before recreating
          var geometry = panelGraphic.geometry

          panelGraphic = new Graphic({
            geometry: geometry,
            symbol: symbol
          });

          graphicsLayer.removeAll();
          graphicsLayer.graphics.add(panelGraphic);
        
        }
  
 });
