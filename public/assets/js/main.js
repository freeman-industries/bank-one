NodeList.prototype.forEach = Array.prototype.forEach;

//GOTTA MAKE SURE DRAG N DROP IS SUPPORTED
tests = {
  filereader: typeof FileReader != 'undefined',
  dnd: 'draggable' in document.createElement('span'),
  formdata: !!window.FormData,
  progress: "upload" in new XMLHttpRequest
};


function formatDate(date_string){
  return date_string.replace("Mon", "Monday,").replace("Tue", "Tuesday,").replace("Wed", "Wednesday,").replace("Thu", "Thursday,").replace("Fri", "Friday,").replace("Sat", "Saturday,").replace("Sun", "Sunday,").replace("Jan", "January").replace("Feb", "February").replace("Mar", "March").replace("Apr", "April").replace("Jun", "June").replace("Jul", "July").replace("Aug", "August").replace("Sep", "September").replace("Oct", "October").replace("Nov", "November").replace("Dec", "December");
}


function makeTile(data){
  var tile = document.createElement("div");
  tile.className = "tile";
  tile.innerHTML = '<div class="wrapper"></div>';

  var img = document.createElement("div");
  img.className = "thumbnail"

  if (/(jpe?g|png|gif|svg)/g.test(data.mimetype)) {
    img.setAttribute("style", "background-image:url(" + data.url + ");");
  } else {
    var extension = document.createElement("div");
    extension.className = "extension";
    img.appendChild(extension);
  }

  tile.querySelector(".wrapper").appendChild(img);

  var filename = document.createElement("div");
  filename.className = "filename";
  filename.innerHTML = data.filename;

  var mimetype = document.createElement("div");
  mimetype.innerHTML = data.mimetype;

  filename.appendChild(mimetype);

  tile.querySelector(".wrapper").appendChild(filename);

  return tile;
}


function renderTiles(filter){
  var files_victim = window._files;
  var files_view = document.querySelector(".files-view");
  var dates = {};

  //wipe the files_view
  files_view.innerHTML = "";

  if(filter !== undefined && filter !== null && filter.length > 0){
    var temp_object = [];

    files_victim.forEach(function(victim){
      var match = false;

      filter.forEach(function(mime_or_extension){
        if(victim.mimetype.indexOf(mime_or_extension) > -1){
          match = true;
        }
      });

      if(match){
        temp_object.push(victim);
      }
    });

    files_victim = temp_object;
  }

  files_victim.forEach(function(tile){
    var date = new Date(tile.time * 1000);

    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);

    var midnight = date.getTime();

    if(dates[midnight] === undefined){
      dates[midnight] = [];
    }

    dates[midnight].push(tile);
  });

  for(date in dates){
    var section = document.createElement("section");

    var date_title = new Date(parseInt(date));

    section.innerHTML = "<h2>" + formatDate(date_title.toDateString()) + "</h2>";

    var tiles = document.createElement("div");
    tiles.className = "tiles";

    dates[date].forEach(function(tile){
      tiles.insertBefore(makeTile(tile), tiles.querySelector(".tile"));
    });

    section.appendChild(tiles);

    files_view.insertBefore(section, files_view.querySelector("section"));
  }
}


function readfiles(files) {
  var formData = tests.formdata ? new FormData() : null;
  for (var i = 0; i < files.length; i++) {
    if (tests.formdata) formData.append('file', files[i]);
  }

  // now post a new XHR request
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/upload');
  xhr.onload = function(e) {

    if(!e.target.responseText){
      console.log("ERRO ERROR ERRORO");
      return;
    }

    var response = JSON.parse(e.target.responseText);

    console.log(response);

    makeTile(response);

  };

  if(xhr.upload){
    xhr.upload.onprogress = function(e){
      if(e.lengthComputable){
        // progressBar.value = (e.loaded / e.total) * 100;
        // progressBar.textContent = progressBar.value;

        console.log((e.loaded / e.total) * 100);
      }
    };
  }

  xhr.send(formData);
}

if (tests.dnd) {

  window.addEventListener("dragover", function(e){

    console.log("DUDE! you're dragging!!!");

    // holder.className = 'dragging';
    e.stopPropagation();
    e.preventDefault();
  });

  window.addEventListener("dragend", function(e){
    // holder.className = '';
    e.preventDefault();
  });

  window.addEventListener("drop", function(e){
    // holder.className = '';
    e.preventDefault();
    readfiles(e.dataTransfer.files);
  });

}

var init = function(){
  var xhr = new XMLHttpRequest();

  function load() {
    if(this.responseText){
      window._files = [];

      var rows = JSON.parse(this.responseText);

      rows.forEach(function(row){
        // makeTile(JSON.parse(row.data));

        row.data = JSON.parse(row.data);
        row.data.id = row.id;
        row.data.time = row.time;

        window._files.push(row.data);
      });

      renderTiles();

      var menu_items = document.querySelectorAll(".menu .menu-item");

      menu_items.forEach(function(item){
        item.addEventListener("click", function(){
          var filter = item.getAttribute("data-filter");
          var filter_array = (filter === null) ? [] : filter.split(",");

          renderTiles(filter_array);

          menu_items.forEach(function(x){
            x.classList.remove("active");
          });

          item.classList.add("active");
        });
      });
    }
  }

  var url = "/files";

  xhr.addEventListener('load', load);
  xhr.open("get", url, true);
  xhr.send();
};

init();
