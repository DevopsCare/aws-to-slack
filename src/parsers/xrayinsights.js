//
// AWS X-Ray Insights event parser
//
exports.matches = event =>
		_.get(event.message, "source") === "aws.xray";

exports.parse = event => {
	const message = event.message;

	const id = _.get(message, "InsightId");
	const state = _.get(message, "message.detail.State");

	if (state === "CLOSED") {
		return true		// not handling yet
	}

	const detailType = event.get("detail-type");
	const description = event.get("detail.Summary")

	const createdAt = new Date(event.get("detail.StartTime"));
	const accountId = _.get(message, "account");
	const region = _.get(message, "region");

	const fields = [];

	return event.attachmentWithDefaults({
		author_name: detailType,
		fallback: description,
		title: description,
		fields: fields,
		mrkdwn_in: ["title", "text"],
		ts: createdAt,
	})
};
