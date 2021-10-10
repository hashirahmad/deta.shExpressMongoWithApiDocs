<!-- # Overview
This is a fast location sharing system.  Players of all games and all worlds can post their player_id with a position.  Other players can query for nearby players given a position.

A position can be of type `lobby`, `2D`, `3D`, `geolocation`

All locations are ephemeral and can vanish at any point.  The player or game can add/remove a player's location.  Locations are also removed automatically after a set period of time (typically 1 hour) unless shorter is specified.  The longest a location can exist for is 1 hour so needs regular updating if it needs to persist longer.

All location types can also be given a `world` parameter so locations are kept in their own distinct domains.  By default world has the value `earth`

## Lobby

This is used for players gathering in a lobby/level or other environment that has no concept of a location.  Use this so people can discover fellow players in the given environment.  A typical lobby name would be the `title_id` or `round_id` for instance.  Any arbitrary string can be used for the world name.

## 2D 

Provide a floating point x,y position to place a player's location.
Typically you should always provide `world` as well with this, such as the game name, world people are playing in or round they are competing in.

## 3D

Same as 2D but with x,y,z location.
Typically you should always provide `world` as well with this, such as the game name, world people are playing in or round they are competing in.

## Geolocation

Used for spherical surface locations where shortest geodesic is used to calculate distances.  This is typically useful for co-ordinates on earth but other worlds can be provided if game specific.  E.g. making a `pokemon go` style game can be done by using earth geolocations but set a specific world such as 'pokemonworld'.  You may want location locking to prevent other users from adding/removing items to a world, speak to support to request this feature. -->
