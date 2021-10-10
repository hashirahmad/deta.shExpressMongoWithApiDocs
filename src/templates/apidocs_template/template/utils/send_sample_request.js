define([
    'jquery',
    'lodash'
], function($, _) {

    var initDynamic = function() {
        // Button send
        $(".sample-request-send").off("click");
        $(".sample-request-send").on("click", function(e) {
            e.preventDefault();
            var $root = $(this).parents("article");
            var group = $root.data("group");
            var name = $root.data("name");
            var version = $root.data("version");
            sendSampleRequest(group, name, version, $(this).data("sample-request-type"));
        });

        // Button clear
        $(".sample-request-clear").off("click");
        $(".sample-request-clear").on("click", function(e) {
            e.preventDefault();
            var $root = $(this).parents("article");
            var group = $root.data("group");
            var name = $root.data("name");
            var version = $root.data("version");
            clearSampleRequest(group, name, version);
        });
    }; // initDynamic

    async function asyncDigestMessage(message) 
    {
        const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
        const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
        return hashHex;
    }    

    // Specificially for CMPS
    async function asyncGenerateSignatureHeaderForKYC( data, header )
    {
        // These should be manually set in your local storage
        const API_KEY = localStorage.getItem("KYC_API_KEY"); // "global.config.signature_key";
        const API_SECRET = localStorage.getItem("KYC_API_SECRET"); // "global.config.signature_secret";
        return await asyncGenerateSignatureHeaderWithKeySecret( data, API_KEY, API_SECRET, header );
    }    

    // Create the signed header
    async function asyncGenerateSignatureHeaderWithKeySecret( data, key, secret, header )
    {
        const currentTimestamp = new Date().getTime();
        let nonce = Math.floor( Math.random() * 1000000000 );
        const stringToHash = ( key + currentTimestamp + nonce + data + secret );

        // console.log( "data:"+data );
        // console.log( "stringToHash:"+stringToHash );
        // console.log( "stringToHashLen:"+stringToHash.length );
        // console.log( "key:" + key );
        // console.log( "secret:" + secret );

        const signature = await asyncDigestMessage( stringToHash );
        //let header = {}; 
        header["x-auth-timestamp"] = currentTimestamp;
        header["x-auth-version"] = 2;
        header["x-auth-nonce"] = nonce;
        header["x-auth-signature"] = signature;
        header["x-auth-source"] = "apidocs";

        return header;
    }

    async function sendSampleRequest(group, name, version, type)
    {
        var $root = $('article[data-group="' + group + '"][data-name="' + name + '"][data-version="' + version + '"]');

        // Optional header
        var header = {};
        $root.find(".sample-request-header:checked").each(function(i, element) {
            var group = $(element).data("sample-request-header-group-id");
            $root.find("[data-sample-request-header-group=\"" + group + "\"]").each(function(i, element) {
                var key = $(element).data("sample-request-header-name");
                var value = element.value;
                if (typeof element.optional === 'undefined') {
                  element.optional = true;
                }
                if ( ! element.optional && element.defaultValue !== '') {
                    value = element.defaultValue;
                }
                header[key] = value;
            });
        });


        // create JSON dictionary of parameters
        var param = {};
        var paramType = {};
        var bodyFormData = {};
        var bodyFormDataType = {};
        var bodyJson = '';
        $root.find(".sample-request-param:checked").each(function(i, element) {
            var group = $(element).data("sample-request-param-group-id");
            var contentType = $(element).nextAll('.sample-header-content-type-switch').first().val();
            if (contentType == "body-json"){
                $root.find("[data-sample-request-body-group=\"" + group + "\"]").not(function(){
                    return $(this).val() == "" && $(this).is("[data-sample-request-param-optional='true']");
                }).each(function(i, element) {
                    if (isJson(element.value)){
                        header['Content-Type'] = 'application/json';
                        bodyJson = element.value;
                    }
                });
            }else {
                $root.find("[data-sample-request-param-group=\"" + group + "\"]").not(function(){
                    return $(this).val() == "" && $(this).is("[data-sample-request-param-optional='true']");
                }).each(function(i, element) {
                    var key = $(element).data("sample-request-param-name");
                    var value = element.value;
                    if ( ! element.optional && element.defaultValue !== '') {
                        value = element.defaultValue;
                    }
                    if( value !== "" )
                    {
                        // If we find a space character just change that to an empty string to write in.
                        if( value == " " )
                        {
                            console.log("Setting param:"+key+" which had a space in to be an empty string");
                            value = "";
                        }
                        if (contentType == "body-form-data"){
                            header['Content-Type'] = 'multipart/form-data'
                            bodyFormData[key] = value;
                            bodyFormDataType[key] = $(element).next().text();
                        }else {
                            param[key] = value;
                            paramType[key] = $(element).next().text();
                        }
                    }
                    else
                    {
                        console.log("Skipping empty string param:"+key);
                    }
                });
            }
        });

        // grab user-inputted URL
        var url = $root.find(".sample-request-url").val();

        //Convert {param} form to :param
        url = url.replace(/{/,':').replace(/}/,'');

        // Insert url parameter
        var pattern = pathToRegexp(url, null);
        var matches = pattern.exec(url);
        for (var i = 1; i < matches.length; i++) {
            var key = matches[i].substr(1);
            if (param[key] !== undefined) {
                url = url.replace(matches[i], encodeURIComponent(param[key]));

                // remove URL parameters from list
                delete param[key];
            }
        } // for


        //add url search parameter
        if (header['Content-Type'] == 'application/json' ){
            url = url + encodeSearchParams(param);
            param = bodyJson;
        }else if (header['Content-Type'] == 'multipart/form-data'){
            url = url + encodeSearchParams(param);
            param = bodyFormData;
        }

        $root.find(".sample-request-response").fadeTo(250, 1);
        $root.find(".sample-request-response-json").html("Loading...");
        refreshScrollSpy();

        // send AJAX request, catch success or error callback
        let datastring = JSON.stringify(param);
        header = await asyncGenerateSignatureHeaderForKYC(datastring, header);
        var ajaxRequest = {
            url        : url,
            headers    : header,
            data       : param,
            type       : type.toUpperCase(),
            success    : displaySuccess,
            error      : displayError
        };

        $.ajax(ajaxRequest);


        function displaySuccess(data, status, jqXHR) {
            var jsonResponse;
            try {
                jsonResponse = JSON.parse(jqXHR.responseText);
                jsonResponse = JSON.stringify(jsonResponse, null, 4);
            } catch (e) {
                jsonResponse = jqXHR.responseText;
            }
            $root.find(".sample-request-response-json").text(jsonResponse);
            refreshScrollSpy();
        };

        function displayError(jqXHR, textStatus, error) {
            var message = "Error " + jqXHR.status + ": " + error;
            var jsonResponse;
            try {
                jsonResponse = JSON.parse(jqXHR.responseText);
                jsonResponse = JSON.stringify(jsonResponse, null, 4);
            } catch (e) {
                jsonResponse = jqXHR.responseText;
            }

            if (jsonResponse)
                message += "\n" + jsonResponse;

            // flicker on previous error to make clear that there is a new response
            if($root.find(".sample-request-response").is(":visible"))
                $root.find(".sample-request-response").fadeTo(1, 0.1);

            $root.find(".sample-request-response").fadeTo(250, 1);
            $root.find(".sample-request-response-json").text(message);
            refreshScrollSpy();
        };
    }

    function clearSampleRequest(group, name, version)
    {
        var $root = $('article[data-group="' + group + '"][data-name="' + name + '"][data-version="' + version + '"]');

        // hide sample response
        $root.find(".sample-request-response-json").html("");
        $root.find(".sample-request-response").hide();

        // reset value of parameters
        $root.find(".sample-request-param").each(function(i, element) {
            element.value = "";
        });

        // restore default URL
        var $urlElement = $root.find(".sample-request-url");
        $urlElement.val($urlElement.prop("defaultValue"));

        refreshScrollSpy();
    }

    function refreshScrollSpy()
    {
        $('[data-spy="scroll"]').each(function () {
            $(this).scrollspy("refresh");
        });
    }

    function escapeHtml(str) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }


    /**
     * is Json
     */
    function isJson(str) {
        if (typeof str == 'string') {
            try {
                var obj=JSON.parse(str);
                if(typeof obj == 'object' && obj ){
                    return true;
                }else{
                    return false;
                }
            } catch(e) {
                return false;
            }
        }
    }

    /**
     * encode Search Params
     */
    function encodeSearchParams(obj) {
        const params = [];
        Object.keys(obj).forEach((key) => {
            let value = obj[key];
            params.push([key, encodeURIComponent(value)].join('='));
        })
        return params.length === 0 ? '' : '?' + params.join('&');
    }

    /**
     * Exports.
     */
    return {
        initDynamic: initDynamic
    };

});
