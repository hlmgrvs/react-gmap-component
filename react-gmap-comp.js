import React, { Component } from "react";
import axios from "./axios";

class Gmapgeo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            accidents: [],
            coordinates: []
        };
        this.initMap = this.initMap.bind(this);
        this.getAccidents = this.getAccidents.bind(this);
        this.getGeoLocation = this.getGeoLocation.bind(this);
        this.renderMap = this.renderMap.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.submitHandler = this.submitHandler.bind(this);
    }

    submitHandler() {
        this.props.handlerFromParent(this.state.coordinates);

        this.setState({
            coordinates: []
        });
    }

    handleChange(event) {
        this.setState({
            coordinates: event.target.value
        });
    }

    componentDidMount() {
        this.getAccidents();
        this.getGeoLocation();
    }

    getGeoLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                this.setState({
                    lat: +position.coords.latitude,
                    lng: +position.coords.longitude
                });
            });
        } else {
            error => console.log("error @ getGeoLocation", error);
        }
    }

    renderMap() {
        loadScript(
            "https://maps.googleapis.com/maps/api/js?key=<KEY>"
        );
        window.initMap = this.initMap;
    }

    getAccidents() {
        axios
            .get("/markers")
            .then(response => {
                this.setState(
                    {
                        accidents: response.data
                    },
                    this.renderMap()
                );
            })
            .catch(error => {
                console.log("ERROR!! " + error);
            });
    }

    initMap() {
        var address;
        var valuesContainer;
        var self = this;
        var map = new window.google.maps.Map(document.getElementById("map"), {
            // center: {lat: this.state.lat, lng: this.state.lng},
            center: { lat: 52.49184, lng: 13.360036 },

            zoom: 12
        });

        var infowindow = new window.google.maps.InfoWindow();

        var geocoded = this.state.accidents;
        console.log(this.state.accidents);
        geocoded.map(myAccident => {
            var contentString = `Address: ${myAccident.street}, Accidents: ${
                myAccident.accidents
            }`;
            var myLat = +myAccident.lat;
            var myLng = +myAccident.lng;
            var marker = new window.google.maps.Marker({
                position: { lat: myLat, lng: myLng },
                map: map,
                icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            });

            marker.addListener("click", function() {
                infowindow.setContent(contentString);
                infowindow.open(map, marker);
            });
        });

        map.addListener("click", function(e) {
            placeMarker(e.latLng, map);
        });

        function placeMarker(latLng, map) {
            var newMarker = new window.google.maps.Marker({
                position: latLng,
                map: map,
                draggable: true,
                animation: window.google.maps.Animation.DROP
            });

            function getReverseGeocodingData(lat, lng) {
                console.log("getReverseGeocodingData lat, lng:", lat, lng);
                var latlng = new window.google.maps.LatLng(lat, lng);
                var geocoder = new window.google.maps.Geocoder();
                return geocoder.geocode({ latLng: latlng }, function(
                    results,
                    status
                ) {
                    if (status !== window.google.maps.GeocoderStatus.OK) {
                        alert(status);
                        console.log("first if ", status);
                    }
                    if (status == window.google.maps.GeocoderStatus.OK) {
                        console.log(
                            "formatted_address ",
                            results[0].formatted_address
                        );
                        var address = results[0].formatted_address;
                        return address;
                    }
                });
            }

            Promise.all([
                newMarker.getPosition().lat(),
                newMarker.getPosition().lng()
            ]).then(async values => {
                valuesContainer = values;
                address = await getReverseGeocodingData(values[0], values[1]);
                console.log(" address", address);

                self.setState({
                    coordinates: valuesContainer,
                    address: address
                });
                console.log(
                    "values, address from promises",
                    valuesContainer,
                    address
                );
                self.submitHandler(valuesContainer, address);
            });

            newMarker.addListener("click", function() {
                infowindow.setContent("contentString: ", address);
                infowindow.open(map, newMarker);
            });
        }
    }

    render() {
        return (
            <main>
                <div className="map-container" id="map" />
                <div />
            </main>
        );
    }
}

function loadScript(url) {
    var index = window.document.getElementsByTagName("script")[0];
    var script = window.document.createElement("script");
    script.src = url;
    script.async = true;
    script.defer = true;
    index.parentNode.insertBefore(script, index);
}

export default Gmapgeo;
