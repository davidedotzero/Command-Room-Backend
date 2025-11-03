import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JWTStrategy } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";
import dotenv from "dotenv";

dotenv.config();

passport.use(new GoogleStrategy(
    {
        callbackURL: "/api/auth/google/redirect",
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    },
    (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
    }
));

passport.use(new JWTStrategy(
    {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET as string
    },
    (jwt_payload, done) => {
        // TODO: remove this sheesh
        return done(null, jwt_payload);
    }
))
