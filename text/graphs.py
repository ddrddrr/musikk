import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick
import os
import textwrap

# def replace_commas_in_quotes(line: str) -> str:
#     result = []
#     in_quotes = False
#     for ch in line:
#         if ch == '"':
#             in_quotes = not in_quotes
#             result.append(ch)
#         elif ch == "," and in_quotes:
#             result.append("|")
#         else:
#             result.append(ch)
#     return "".join(result)
#
# with open("res.csv", "r", encoding="utf-8") as infile, open("res2.csv", "w", encoding="utf-8") as outfile:
#     for line in infile:
#         outfile.write(replace_commas_in_quotes(line))


data = pd.read_csv("survey_results.csv")
data.drop("Timestamp", axis="columns", inplace=True)

output_dir = "charts"
os.makedirs(output_dir, exist_ok=True)


def wrap_text(text, width=40):
    return "\n".join(textwrap.wrap(str(text), width))


question_titles = {
    "age": "How old are you?",
    "constumption method": "How do you mostly consume audio media?",
    "listening regularity": "How often do you listen to music?",
    "song amount month": "Roughly - how much songs do you listen to in a month?",
    "song consistency": "Would you say that you are consistent with the music you listen to?\n"
    " I.e. do you mostly listen to the same artists/songs/genres?",
    "new discovery freq": "How often do you listen to something new?",
    "discovery methods": "How do you find out about new music?",
    "similar music taste": "Would you say that you know\n"
    " a lot of people with similar music taste?",
    "connect with others": " Would you like to connect with others who share your musical taste,\n"
    " or influence those around you to explore and appreciate the music you enjoy? ",
    "listen together method": "Are there any situations, when you listen to music with someone else?",
    "listen together freq": "How often do you listen to music with someone else?",
    "share freq": "How often do you/your friends share/discuss music?",
    "share method": "How does that happen?",
    "streaming platform": "What platform do you use?",
    "social features use": "Would you benefit, if current streaming platforms\n"
    " added extra social features(i.e. would you use them)?",
    "extra": "Any additional comments?",
}

multiselect_indexes = [1, 2, 3, 6, 9, 12, 13]
multiselect_columns = [data.columns[i] for i in multiselect_indexes]


def audio_consumption_method(d):
    dummies = d["constumption method"].str.get_dummies(sep="|")

    total_counts = dummies.sum()
    common = total_counts[total_counts > 1]
    other = total_counts[total_counts <= 1]

    common_cols = common.index.tolist()
    dummies_filtered = dummies[common_cols].copy()
    if not other.empty:
        dummies_filtered["Other"] = dummies[other.index].sum(axis=1)

    df = pd.concat([d["age"], dummies_filtered], axis=1)
    counts = df.groupby("age")[dummies_filtered.columns].sum()
    group_sizes = d.groupby("age").size()
    percentages = counts.div(group_sizes, axis=0)

    fig, ax = plt.subplots(figsize=(14, 8))
    percentages.plot(kind="bar", ax=ax)

    ax.yaxis.set_major_formatter(mtick.PercentFormatter(xmax=1))
    ax.set_ylabel("Percentage of respondents", fontsize=18)
    ax.set_xlabel("Age Group", fontsize=18)
    ax.set_title(question_titles["constumption method"], fontsize=20)

    ax.tick_params(axis="both", labelsize=16)

    wrapped_labels = [wrap_text(label, 30) for label in percentages.columns]

    ax.legend(
        wrapped_labels,
        title="Method",
        bbox_to_anchor=(1.05, 1),
        loc="upper left",
        prop={"size": 20},
        title_fontsize=16,
    )

    plt.savefig(
        os.path.join(output_dir, "constumption_method.png"),
        bbox_inches="tight",
        dpi=300,
    )
    plt.close()


def generate_charts(df):
    for col in df.columns:
        if col in {"constumption method"}:
            continue
        series = df[col].dropna()
        is_multiselect = col in multiselect_columns

        if is_multiselect:
            dummies = series.str.get_dummies(sep="|")

            raw_counts = dummies.sum()
            common = raw_counts[raw_counts > 1]
            other_count = raw_counts[raw_counts <= 1].sum()

            counts = common.copy()
            if other_count > 0:
                counts["Other"] = other_count
            counts = counts.sort_values(ascending=False)

            labels = [wrap_text(label, 30) for label in counts.index]

            fig, ax = plt.subplots(figsize=(9, 6))

            x = range(len(counts))
            bars = ax.bar(x, counts.values, color="coral")

            ax.set_xticks(x)
            ax.set_xticklabels(labels, rotation=45, ha="right", fontsize=12)

            max_val = counts.max()
            ax.set_ylim(0, max_val * 1.2)
            for bar, val in zip(bars, counts.values):
                ax.text(
                    bar.get_x() + bar.get_width() / 2,
                    val + max_val * 0.03,  # small offset above bar
                    f"{val} ({val / series.shape[0] * 100:.1f}%)",
                    ha="center",
                    va="bottom",
                    fontsize=12,
                )

            ax.set_ylabel("Number of respondents", fontsize=14)
            ax.set_title(
                wrap_text(
                    question_titles.get(col, col.replace("_", " ").capitalize()), 60
                ),
                fontsize=18,
            )

            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, f"{col}.png"), dpi=300)
            plt.close()
        elif series.nunique() < 20:
            counts = series.value_counts()
            labels = [wrap_text(label, 40) for label in counts.index]

            fig, ax = plt.subplots(
                figsize=(3, 2),
                subplot_kw=dict(aspect="equal"),
            )
            wedges, texts, autotexts = ax.pie(
                counts, autopct="%1.1f%%", startangle=140, textprops={"fontsize": 7}
            )
            ax.legend(
                wedges,
                labels,
                title="Answers",
                loc="center left",
                bbox_to_anchor=(1, 0.5),
                prop={"size": 8},
                title_fontsize=10,
            )
            ax.set_title(
                wrap_text(
                    question_titles.get(col, col.replace("_", " ").capitalize()), 60
                ),
                fontsize=10,
            )
            plt.savefig(
                os.path.join(output_dir, f"{col}.png"), bbox_inches="tight", dpi=300
            )
            plt.close()


audio_consumption_method(data)
generate_charts(data)
