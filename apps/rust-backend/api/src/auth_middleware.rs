use jsonwebtoken::{DecodingKey, Validation, decode};
use poem::{Error, FromRequest, Request, RequestBody, Result, http::StatusCode};

use crate::routes::user::Claims;

// unit struct 
pub struct UserId(pub String);


impl<'a> FromRequest<'a> for UserId {
    async fn from_request(req: &'a Request, _body: &mut RequestBody) -> Result<Self> {
        let token = req
            .headers()
            .get("authorization")
            .and_then(|value| value.to_str().ok())
            .ok_or_else(|| Error::from_string("missing token", StatusCode::UNAUTHORIZED))?;

            let token_data = decode::<Claims>(&token, &DecodingKey::from_secret("secret".as_ref()), &Validation::default()).map_err(|_| Error::from_string("Invalid token",(StatusCode::UNAUTHORIZED)));
            Ok(UserId(token_data?.claims.sub))

    }
}
