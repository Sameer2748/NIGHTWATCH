use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct CreateWebsiteRequest {
    pub url:String
}

