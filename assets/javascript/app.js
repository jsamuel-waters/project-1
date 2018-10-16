//DB details
var config = {
  apiKey: "AIzaSyDTz5XIyuo9nULZHqpuPchQL4TVNsXS32o",
  authDomain: "myrcbclass.firebaseapp.com",
  databaseURL: "https://myrcbclass.firebaseio.com",
  projectId: "myrcbclass",
  storageBucket: "myrcbclass.appspot.com",
  messagingSenderId: "229680771388"
};
firebase.initializeApp(config);

var dataRef = firebase.database();

var arr_fb_recs = []; //array to store the results from the fb node "/meal_planner/user_keywords"
//End of DB config

//Reterives the latest values from db and populates the last searched values from db
dataRef.ref("/meal_planner/user_keywords").orderByChild("dateAdded").limitToLast(1).on("child_added", function(snapshot) {


    // Change the HTML to reflect
    $("#last_ingr").html("The last ingredient searched was <strong>" + snapshot.val().entree_ingr_name + "</strong>");
    $("#last_drink").html("The last drink searched was <strong>" + snapshot.val().drink_keyword + "</strong>");


});
//end of this code

//gets the handle for the /meal_planner/user_keywords node from db
var query = dataRef.ref("/meal_planner/user_keywords").orderByChild("dishIngredient_drinkKeywrd")

query.on('child_added', function(snapshot) {

  //pushing each dishIngredient_drinkKeywrd in the array every time this function runs, i.e. the number of children 
  //@ the node =/meal_planner/user_keywords
  arr_fb_recs.push(snapshot.val().dishIngredient_drinkKeywrd);
  //console.log(aaa);

  var distribution = {};
  var max = 0;
  var result = [];

  arr_fb_recs.forEach(function(a) {
      distribution[a] = (distribution[a] || 0) + 1;
      if (distribution[a] > max) {
          max = distribution[a];
          result = [a];
          return;
      }
      if (distribution[a] === max) {
          result.push(a);
      }
  });
  console.log('max: ' + max);
  console.log('key/s with max count: ' + JSON.stringify(result));
  console.log(distribution);
  //displays the search combination with highest frequency
  $("#highest_freq_combo").html("The search combination with highest frequency is " + "<b>" + JSON.stringify(result) + "</b>" + ", with value = " + "<b>" + max + "</b>");

});


//handle 'return' key press to return dish and drinks list
$(document).keypress(function(e) {
  if (e.which == 13 || event.keyCode == 13) {
      //alert('enter key is pressed');
      getdishes_n_drinks();
  }
});

//on click on Click me button gets the dishes and drinks list
$(document).on("click", "#ingredient", getdishes_n_drinks);

function getdishes_n_drinks() {

  $("#drink-list-dynamic").empty();
  $("#meals-list-dynamic").empty();

  dataRef.ref("/meal_planner/user_keywords").push({
      entree_ingr_name: $("#ingr-input").val(),
      drink_keyword: $("#drnk-input").val(),
      //creating in below line a combo key that will aid to determine the combination with highest frequency
      dishIngredient_drinkKeywrd: $("#ingr-input").val() + "_" + $("#drnk-input").val(),
      dateAdded: firebase.database.ServerValue.TIMESTAMP
  });



  console.log($("#ingr-input").val());
  //forming the dishes search URL
  var url = "https://www.themealdb.com/api/json/v1/1/filter.php?i=" + $("#ingr-input").val();
  var urlE = encodeURI(url);
  console.log(urlE);

  //drink passed in
  drink = $("#drnk-input").val();
  console.log(drink);
 //forming the drinks search URL
  url = "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=" + drink;
  uri = encodeURI(url);
  console.log(uri);

  $.ajax({
          url: urlE,
          method: "GET"
      })
      .then(function(response) {

          for (var i = 0; i < response.meals.length; i++) {
              //  console.log("Meal is "+response.meals[i].strMeal);
              var mealID = "meal-" + i;
              var mealName = response.meals[i].strMeal;
              var mealButtonID = response.meals[i].idMeal;

              var mealListItem = `
    <div class="card-header dish_nm" name="` + mealName + `" id="` + mealButtonID + `">
        <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#` + mealID + `" aria-expanded="true" aria-controls="` + mealID + `">
          <h5>` + mealName + `</h5>
        </button>
    </div>

    <div id="` + mealID + `" class="collapse" aria-labelledby="` + mealButtonID + `" data-parent="#meal-accordion-list">
      <div class="card-body">
            <div class="row mx-auto">
                <div id=meal-` + mealButtonID + `></div>
            </div>
      </div>
   `;

              $("#meals-list-dynamic").append(mealListItem);

          }

      })

  //2nd AJAX call to Cocktail API

  $.ajax({
          url: uri,
          method: "GET"
      })
      .then(function(response) {
          var drinks = response.drinks;
          console.log(drinks.length);

          for (var i = 0; i < drinks.length; i++) {

              var drinkID = "drink-" + i;
              var drinkName = drinks[i].strDrink;
              var drinkButtonID = drinks[i].idDrink;

              var drinkListItem = `
    <div class="card-header drnk_nm" name="` + drinkName + `" id="` + drinkButtonID + `">
        <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#` + drinkID + `" aria-expanded="true" aria-controls="` + drinkID + `">
          <h5>` + drinkName + `</h5>
        </button>
    </div>

    <div id="` + drinkID + `" class="collapse" aria-labelledby="` + drinkButtonID + `" data-parent="#drink-accordion-list">
      <div class="card-body">
            <div class="row mx-auto">
                <div id=drink-` + drinkButtonID + `></div>
            </div>
      </div>
   `;

              $("#drink-list-dynamic").append(drinkListItem);

          }


      })

  //empties the input values after dishes and drinks are returned
  $("#ingr-input").val("");
  $("#drnk-input").val("");

}

//on click of each dish, calls the getdishdetails fn.
$(document).on("click", ".dish_nm", getdishdetails);


//getdishdetails function
function getdishdetails() {

  var mealID = $(this).attr("aria-controls");
  var mealName = $(this).attr("name");
  var mealButtonID = $(this).attr("id");

  $("#meal-" + mealButtonID).empty();

  console.log("You clicked on " + $(this).attr("name"));

  var url = "https://www.themealdb.com/api/json/v1/1/search.php?s=" + $(this).attr("name");
  var urlE = encodeURI(url);
  console.log(urlE);

  $.ajax({
          url: urlE,
          method: "GET"
      })
      .then(function(response) {
          // var results = response.data;


          var imgsrc = response.meals[0].strMealThumb;
          console.log(imgsrc);
          var imgdiv = $("<img>");
          imgdiv.attr("src", imgsrc);
          $("#meal-" + mealButtonID).append(imgdiv);

          let i = 1;
          //forming the table and appending to its parent div 
          $("#meal-" + mealButtonID).append("<table class='table' id ='dish_tbl'><thead><tr><th><b>Ingredient</b></th><th><b>Measure</b></th></tr></thead><tbody>");
          for (i; i <= 20; i++) {
              let ingredient = "strIngredient" + i.toString();
              let measure = "strMeasure" + i.toString();
              if (response.meals[0][ingredient]) {
                 // $("#meal-" + mealButtonID).append(
                    $("#dish_tbl > tbody").append(
                      "<tr><td>" + response.meals[0][ingredient] + "</td><td>" + response.meals[0][measure] + "</td></tr>"

                  );

              }
          }
          $("#meal-" + mealButtonID).append("</tbody></table>");
          //dish image
          var dish_typ_p = $("<p>");
          dish_typ_p.html("<b>Dish type is: </b>" + response.meals[0].strArea);
          $("#meal-" + mealButtonID).append(dish_typ_p);

          //dish instructions
          var recipe_p = $("<p>");
          recipe_p.addClass("dish_receipe");
          recipe_p.html("<b>Instructions</b>: " + response.meals[0].strInstructions);
          recipe_p.html(recipe_p.html().replace(/\n/g, '<br/><br/>'));
          $("#meal-" + mealButtonID).append(recipe_p);
          
          //dish video
          var dish_video = $("<p>");
          dish_video.addClass("dish_video");
          var aa = response.meals[0].strYoutube.toString();
          var bb = aa.replace("watch?v=", "embed/");
          dish_video.html("<iframe width='500' height='315' src=" + bb + " frameborder='0' allow=autoplay; encrypted-media allowfullscreen></iframe>");
          $("#meal-" + mealButtonID).append(dish_video);

      })
};


//on click of each dish, calls the getdrinkdetails fn.
$(document).on("click", ".drnk_nm", getdrnkdetails);


//getdrinkdetails function 
function getdrnkdetails() {
  var drinkID = $(this).attr("aria-controls");
  var drinkName = $(this).attr("name");
  var drinkButtonID = $(this).attr("id");

  // console.log(drinkButtonID);
  $("#drink-" + drinkButtonID).empty();

  console.log("You clicked on " + $(this).attr("name"));

  var url = "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=" + drinkName;
  var urlE = encodeURI(url);
  console.log(urlE);

  $.ajax({
          url: urlE,
          method: "GET"
      })
      .then(function(response) {
          // var results = response.data;

          var imgsrc = response.drinks[0].strDrinkThumb;
          console.log(imgsrc);
          var imgdiv = $("<img>");
          imgdiv.attr("src", imgsrc);
          $("#drink-" + drinkButtonID).append(imgdiv);

          let i = 1;
          $("#drink-" + drinkButtonID).append("<table class='table' id ='drink_tbl'><thead><tr><th><b>Ingredient</b></th><th><b>Measure</b></th></tr></thead><tbody>");
          //$("#drink-" + drinkButtonID).append("<th><b>Ingredient</b></th><th><b>Measure</b></th>")
          let ingredient = "strIngredient" + i.toString();
          for (i; i <= 15; i++) {
              ingredient = "strIngredient" + i.toString();
              measure = "strMeasure" + i.toString();
              if (response.drinks[0][ingredient]) {
                  //$("#drink-" + drinkButtonID).append(
                  //    console.log("Inside table row ingred");
                  $("#drink_tbl > tbody").append(
                      "<tr><td>" + response.drinks[0][ingredient] + "</td><td>" + response.drinks[0][measure] + "</td></tr>"

                  );

              }
          };
          $("#drink-" + drinkButtonID).append("</tbody></table>");



          //drink image
          var drink_typ_p = $("<p>");
          drink_typ_p.html("<b>Drink type is: </b>" + response.drinks[0].strCategory);
          $("#drink-" + drinkButtonID).append(drink_typ_p);

          //glass type
          var glass_typ_p = $("<p>");
          glass_typ_p.html("<b>Glass type is: </b>" + response.drinks[0].strGlass);
          $("#drink-" + drinkButtonID).append(glass_typ_p);

          //drink instructions
          var recipe_p = $("<p>");
          recipe_p.html("<b>Instructions</b>: " + response.drinks[0].strInstructions);
          recipe_p.html(recipe_p.html().replace(/\n/g, '<br/><br/>'));
          $("#drink-" + drinkButtonID).append(recipe_p);


      })

};