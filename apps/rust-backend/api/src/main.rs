use poem::{post, Route, Server, get, handler, listener::TcpListener, web::{Path, Json}};

use crate::req_inputs::{CreateWebsiteRequest, SignUpUserInput,SignInUserInput};
use crate::req_outputs::{CreateWebsiteResponse,GetWebsiteResponse, SignUpUserOutput,SignInUserOutput};
use store::store::Store;

pub mod req_inputs;
pub mod req_outputs;


#[handler]
fn getwebsite(Path(id): Path<String>) -> Json<GetWebsiteResponse> {
    // store the url in the store library 
    let mut s = Store::default().expect("Failed to create store connection");
    let website = s
        .get_website(id)
        .unwrap();
    Json(GetWebsiteResponse{url: website.url})

}
#[handler]
fn createwebsite(Json(data): Json<CreateWebsiteRequest>) -> Json<CreateWebsiteResponse> {
    let url: String = data.url;
    // store the url in the store library 
    let mut s = Store::default().expect("Failed to create store connection");
    let website = s
        .create_website(String::from("dbf7faa7-f823-4887-9109-7dec0afe0f62"), url)
        .expect("Failed to persist website");

    let response: CreateWebsiteResponse = CreateWebsiteResponse {
        id: website.id
    };

    Json(response)
}

#[handler]
fn signupuser(Json(data): Json<SignUpUserInput>) -> Json<SignUpUserOutput>{
    let name = data.name;
    let password = data.password;
    let mut s = Store::default().expect("Failed to create store connection");
    let id = s
        .signup_user(name, password).expect("Failed to persist website");

    let response = SignUpUserOutput{
        id: id
    };
    Json(response)
}
#[handler]
fn signinuser(Json(data): Json<SignInUserInput>) -> Json<SignInUserOutput>{
    let name = data.name;
    let password = data.password;
    let mut s = Store::default().expect("Failed to create store connection");
    let _exists = s.signin_user(name.clone(), password).unwrap();

    let response = SignInUserOutput{
        jwt: String::from("sameer")
    };
    Json(response)
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let app = Route::new()
    .at("/status/:websiteId", get(getwebsite))
    .at("/website", post(createwebsite))
    .at("/user/signup", post(signupuser))
    .at("/user/signin", post(signinuser));
    Server::new(TcpListener::bind("0.0.0.0:3002"))
        .run(app)
        .await
}