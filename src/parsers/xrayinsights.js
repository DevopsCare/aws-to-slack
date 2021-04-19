//
// AWS X-Ray Insights event parser
//
exports.matches = event =>
		_.get(event.message, "source") === "aws.xray";

exports.parse = event => {
	const message = event.message;

	const insightId = event.get("detail.InsightId");
	const state = event.get("detail.State");

	if (state === "CLOSED") {
		return true		// not handling yet
	}

	const detailType = event.get("detail-type");
	const groupName = event.get("detail.GroupName")
	const description = event.get("detail.Summary")

	const createdAt = new Date(event.get("detail.StartTime"));
	const accountId = _.get(message, "account");
	const region = _.get(message, "region");

	const fields = [];

	return event.attachmentWithDefaults({
		author_name: detailType,
		fallback: description,
		title: `Group: ${groupName}`,
		title_link: `https://console.aws.amazon.com/xray/home?region=${region}#/insights/${insightId}`,
		text: description,
		fields: fields,
		mrkdwn_in: ["title", "text"],
		ts: createdAt,
	})
};
