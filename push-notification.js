import firebaseAdmin from "firebase-admin";
import firebaseServiceAccount from "../configs/bookmypet-firebase.json"; //import file from firebase config

firebaseAdmin.initializeApp({
	credential: firebaseAdmin.credential.cert(firebaseServiceAccount),
});


async firebaseNotification(event, userId, data) {
		const hasToken = await this.db
			.select("*")
			.table("user_fcm_store")
			.where("user_id", userId);

		const registrationTokens = hasToken.map((user) => {
			return user.firebase_token;
		});

		const templ = notificationsTemplates[event];
		const completeData = { userId, data: data };

		const description = this.tools.template(templ.description, data);

		const payload = {
			notification: {
				title: templ.title,
				body: description,
			},
		};

		const message = {
			tokens: registrationTokens,
			notifications: { ...payload.notification, completeData },
		};

		console.log(message);	

		if (registrationTokens.length > 1) {
			firebaseAdmin
				.messaging()
				.sendMulticast(message)
				.then((resposne) => {
					console.log(resposne);
					console.log("Notifications sent successfully");
				})
				.catch((err) => {
					throw new Error("Send multicast error occurred!");
				});
			return true;
		} else if (registrationTokens.length === 1) {
			firebaseAdmin
				.messaging()
				.sendToDevice(registrationTokens[0], payload, {
					priority: "high",
					timeToLive: 60 * 60 * 24,
				})
				.then((response) => {
					console.log(response);
					console.log("Notification sent successfully");
				})
				.catch((err) => {
					throw new Error("Send to device error occurred!");
				});
			return true;
		} else {
			return false;
		}
	}
