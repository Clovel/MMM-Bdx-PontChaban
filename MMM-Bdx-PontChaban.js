Module.register("MMM-Bdx-PontChaban", {

	// Default module config
	defaults: {
		updateInterval: 60 * 60 * 1000,
		animationSpeed: 1000,
		lang: config.language,
		records: 5,
		modus: "past",
		showExtraInfo: false,
		showColumnHeader: false,
		initialLoadDelay: 2500,
		retryDelay: 2500,
		headerText: "Pont Chaban-Delmas",
		apiBase: "https://opendata.bordeaux-metropole.fr/api/records/1.0/search/?dataset=previsions_pont_chaban",
		tableClass: "small",
	},

	// Define required scripts.
	getScripts: function () {
		return ["moment.js"];
	},

	// Define required stylescripts.
	getStyles: function () {
		return ["MMM-Bdx-PontChaban.css"];
	},

	// Define start sequence.
	start: function () {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.pontChabanEvents = [];
		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);

		this.updateTimer = null;
	},

	// Override dom generator.
	getDom: function () {
		var i = 0;
		var wrapper = document.createElement("div");

		var shortDesc = true;
		switch (this.data.position) {
			case "top_bar":
			case "bottom_bar":
			case "middle_center":
				shortDesc = false;;
				break;
		}

		if (!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var table = document.createElement("table");
		table.className = this.config.tableClass;

		if (this.config.showColumnHeader) {
			table.appendChild(this.getTableHeaderRow());
		}

		console.log(JSON.stringify(this.pontChabanEvents));

		for (var lEventIndex in this.pontChabanEvents.records) {
			var lEvent = this.pontChabanEvents.records[lEventIndex];

			/* ??? */
			var lFermetureEventElmt = document.createElement("tr");
			table.appendChild(lFermetureEventElmt);

			/* Logo de la ville de Bdx */
			var customerIcon = document.createElement("td");
			customerIcon.innerHTML = "<img style='width:1em; height:1em;' src='http://www.bordeaux.fr/blochtml/imagesbloc/bordeaux_big.png' />";
			lFermetureEventElmt.appendChild(customerIcon);

			/* Date de l'evenement */
			var lDateElmt = document.createElement("td");
			lDateElmt.innerHTML = lEvent.fields.date_passage;
			lFermetureEventElmt.appendChild(lDateElmt);
			
			/* Heure de fermeture */
			var lHeureFermetureElmt = document.createElement("td");
			lHeureFermetureElmt.innerHTML = lEvent.fields.fermeture_a_la_circulation;
			lFermetureEventElmt.appendChild(lHeureFermetureElmt);
			
			/* Heure de reouverture */
			var lHeureOuvertureElmt = document.createElement("td");
			lHeureOuvertureElmt.innerHTML = lEvent.fields.re_ouverture_a_la_circulation;;
			lFermetureEventElmt.appendChild(lHeureOuvertureElmt);

			/* Bateau */
			var lBateauElmt = document.createElement("td");
			lBateauElmt.innerHTML = lEvent.fields.bateau;;
			lFermetureEventElmt.appendChild(lBateauElmt);

			if (this.config.showExtraInfo) {
				/* Type de fermeture */
				var lTypeFermetureElmt = document.createElement("td");
				lTypeFermetureElmt.innerHTML = lEvent.fields.type_de_fermeture;;
				lFermetureEventElmt.appendChild(lTypeFermetureElmt);
			}
		}

		return table;
	},

	// Override getHeader method.
	getHeader: function () {
		this.data.header = this.config.headerText + " - " + this.config.modus.toUpperCase();
		return this.data.header;
	},

	// Requests new data from Bdx OpenData API.
	updatePontChabanData: function () {
		var currentDate = new Date(Date.now());
		var endpoint = "";
		var sort = "-date_passage";
		var filter = "date_passage"
		if (this.config.modus === "upcoming") {
			endpoint = "launches/upcoming";
			filter = filter + ">" + currentDate.getFullYear() + "/" + currentDate.getMonth() + "/" + currentDate.getDate();
		} else if (this.config.modus === "past") {
			endpoint = "launches/past";
			filter = filter + "<" + currentDate.year + "/" + currentDate.month + "/" + currentDate.day;
		}

		var url = this.config.apiBase + "&q=" + filter + "&lang=" + this.lang + "&rows="  + this.config.records + "&sort=" + sort + "&timezone=Europe/Paris"
		var self = this;
		var retry = true;

		var apiRequest = new XMLHttpRequest();
		apiRequest.open("GET", url, true);
		apiRequest.onreadystatechange = function () {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processPontChaban(JSON.parse(this.response));
				}
				else if (this.status === 401) {
					self.updateDom(self.config.animationSpeed);
					retry = true;
				}
				else {
					Log.error(self.name + ": Could not load Bdx OpenData data.");
				}

				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		apiRequest.send();
	},

	// processPontChaban
	processPontChaban: function (data) {
		this.pontChabanEvents = data;

		this.show(this.config.animationSpeed, { lockString: this.identifier });
		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},

	// Schedule next update.
	scheduleUpdate: function (delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function () {
			self.updatePontChabanData();
		}, nextLoad);
	},

	getTableHeaderRow: function () {
		var thDummy = document.createElement("th");
		thDummy.appendChild(document.createTextNode(" "));
		var thDate = document.createElement("th");
		thDate.appendChild(document.createTextNode("Date"));
		var thOuverture = document.createElement("th");
		thOuverture.appendChild(document.createTextNode("Ouverture"));
		var thFermeture = document.createElement("th");
		thFermeture.appendChild(document.createTextNode("Fermeture"));
		var thBateau = document.createElement("th");
		thBateau.appendChild(document.createTextNode("Bateau"));
		var thTypeFermeture = document.createElement("th");
		thTypeFermeture.appendChild(document.createTextNode("Type Fermeture"));

		var tHead = document.createElement("thead");
		tHead.appendChild(document.createElement("th"));
		tHead.appendChild(thDummy);
		tHead.appendChild(thDate);
		tHead.appendChild(thOuverture);
		tHead.appendChild(thFermeture);
		tHead.appendChild(thBateau);
		if (this.config.showExtraInfo) {
			tHead.appendChild(thTypeFermeture);
		}

		return tHead;
	},
});
