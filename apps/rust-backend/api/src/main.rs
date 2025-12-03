use poem::{IntoResponse, post, Route, Server, get, handler, listener::TcpListener, web::{Path, Json}};

use crate::req_inputs::CreateWebsiteRequest;
use crate::req_outputs::CreateWebsiteResponse;
use store::store;

pub mod req_inputs;
pub mod req_outputs;


#[handler]
fn getwebsite(Path((websiteId, city)): Path<(String, String)>) -> String {
    format!("hello: websiteId={}, city={}", websiteId, city)
}
#[handler]
fn createwebsite(Json(data): Json<CreateWebsiteRequest>) -> Json<CreateWebsiteResponse> {
    let url:String = data.url;
    // store the url in the store library 
    let s = store{};
    s.create_website(url);

    let response: CreateWebsiteResponse = CreateWebsiteResponse{
        id:String::from("1244")
    };

    Json(response)
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let app = Route::new()
    .at("/status/:websiteId/:city", get(getwebsite))
    .at("/website", post(createwebsite));
    Server::new(TcpListener::bind("0.0.0.0:3002"))
        .run(app)
        .await
}