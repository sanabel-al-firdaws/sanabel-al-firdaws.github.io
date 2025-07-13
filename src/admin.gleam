import formal/form.{type Form}
import gleam/dict.{type Dict}
import gleam/dynamic/decode
import gleam/int
import gleam/javascript/array
import gleam/javascript/promise.{type Promise}
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/order
import gleam/result
import gleam/string
import grille_pain
import grille_pain/lustre/toast
import grille_pain/toast/level
import lustre
import lustre/attribute.{attribute}
import lustre/effect.{type Effect}
import lustre/element as lustre_element
import lustre/element/svg
import lustre/event
import plinth/javascript/storage
import sketch
import sketch/css.{class}
import sketch/css/length
import sketch/css/transform
import sketch/lustre as sketch_lustre
import sketch/lustre/element.{type Element}
import sketch/lustre/element/html

import plinth/browser/document
import plinth/browser/element as browser_element

pub fn main() {
  let assert Ok(_) = grille_pain.simple()
  let assert Ok(stylesheet) = sketch_lustre.setup()

  sketch.global(stylesheet, css.global("body", []))

  let app = lustre.application(init, update, view(_, stylesheet))

  let start_lustre = fn(password) {
    lustre.start(
      app,
      "#app",
      Model(
        password_form: form.new(),
        password: password,
        selected_rooms: [],
        selected_document: None,
        modal: False,
        filesystem_menu: None,
        loro_doc: None,
        tree: None,
        dragged_over_tree_item: None,
        edited_tree_item: None,
        selected_item_name: None,
        expanded_folders: [],
      ),
    )
  }
  let assert Ok(local_storage) = storage.local()
  let password = storage.get_item(local_storage, "github_token")
  case password {
    Ok(old_password) -> {
      do_check_password(old_password, fn(result) {
        case result {
          Ok(_) -> {
            let assert Ok(_) = start_lustre(Some(old_password))

            Nil
          }
          _ -> {
            let assert Ok(_) = start_lustre(None)

            Nil
          }
        }
      })
    }
    _ -> {
      let assert Ok(_) = start_lustre(None)
      Nil
    }
  }

  Nil
}

type Model {
  Model(
    password_form: Form,
    password: Option(String),
    selected_document: Option(String),
    selected_rooms: List(String),
    modal: Bool,
    filesystem_menu: Option(List(String)),
    loro_doc: Option(LoroDoc),
    tree: Option(Node),
    dragged_over_tree_item: Option(String),
    edited_tree_item: Option(String),
    selected_item_name: Option(String),
    expanded_folders: List(String),
  )
}

fn init(model: Model) -> #(Model, Effect(Msg)) {
  #(model, init_tiptap())
}

pub opaque type Msg {
  SaveDocument
  ToggleModal
  DisplayBasicToast(String)
  DisplayErrorToast(String)
  DisplaySelectedRooms(List(String))
  LoroDocCreated(LoroDoc)
  UserDraggedItemOver(String)
  UserDraggedItemOff(String)
  RenderTree(Node)
  UserDroppedItem(String, String)
  DeleteItem(String)
  UserEditingItem(String)
  UserFinishedEditingItem(String)
  UserCanceledEditingItem
  ItemNameHasChanged(String)
  ToggleFolderExpanded(String)
  DoNothing
  DisplayFileSystemMenu(String, String)
  CreateNewNote(String)
  CreateNewFolder(String)
  HideFileSystemMenu
  UserSelectedNote(String)
  DownloadNoteBook
  PasswordSumbitted(List(#(String, String)))
  PasswordIsValid(String)
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    PasswordIsValid(password) -> {
      #(
        Model(..model, password_form: form.new(), password: Some(password)),
        effect.none(),
      )
    }

    PasswordSumbitted(form) -> {
      case form {
        [#("password", password)] -> {
          #(model, check_password(password))
        }
        _ -> #(model, effect.none())
      }
    }
    DoNothing -> #(model, effect.none())

    DownloadNoteBook -> {
      case model.loro_doc {
        Some(loro_doc) -> {
          #(model, download_notebook(loro_doc))
        }
        None -> #(model, effect.none())
      }
    }
    UserSelectedNote(note_id) -> {
      #(
        Model(..model, filesystem_menu: None, selected_document: Some(note_id)),
        user_selected_note(note_id),
      )
    }
    HideFileSystemMenu -> {
      #(Model(..model, filesystem_menu: None), effect.none())
    }
    DisplayFileSystemMenu(item_id, y) -> {
      #(Model(..model, filesystem_menu: Some([item_id, y])), effect.none())
    }
    CreateNewNote(item_id) -> {
      case model.loro_doc {
        Some(loro_doc) -> {
          #(
            Model(..model, filesystem_menu: None),
            create_new_note(loro_doc, item_id),
          )
        }
        None -> {
          #(model, effect.none())
        }
      }
    }
    CreateNewFolder(item_id) -> {
      case model.loro_doc {
        Some(loro_doc) -> {
          #(
            Model(..model, filesystem_menu: None),
            create_new_folder(loro_doc, item_id),
          )
        }
        None -> {
          #(model, effect.none())
        }
      }
    }
    DeleteItem(item_id) ->
      case model.loro_doc {
        Some(loro_doc) -> #(model, delete_item(loro_doc, item_id))
        None -> #(model, effect.none())
      }
    UserCanceledEditingItem -> #(
      Model(..model, selected_item_name: None, edited_tree_item: None),
      effect.none(),
    )

    ToggleFolderExpanded(folder_id) -> {
      let folder_id_list = model.expanded_folders

      case folder_id_list |> list.contains(folder_id) {
        True -> {
          let expanded_folders =
            folder_id_list |> list.filter(fn(id) { id != folder_id })
          #(
            Model(..model, filesystem_menu: None, expanded_folders:),
            init_dnd(),
          )
        }
        False -> {
          let expanded_folders = folder_id_list |> list.append([folder_id])
          #(
            Model(..model, filesystem_menu: None, expanded_folders:),
            init_dnd(),
          )
        }
      }
    }

    ItemNameHasChanged(name) -> {
      #(Model(..model, selected_item_name: Some(name)), effect.none())
    }

    UserEditingItem(item_id) -> #(
      Model(..model, edited_tree_item: Some(item_id)),
      effect.none(),
    )

    UserFinishedEditingItem(item_id) -> {
      case model.loro_doc {
        Some(loro_doc) -> {
          case model.selected_item_name {
            Some(selected_item_name) -> {
              let trimmed_name = selected_item_name |> string.trim()
              #(
                Model(..model, selected_item_name: None),
                change_item_name(loro_doc, item_id, trimmed_name),
              )
            }
            None -> #(
              Model(..model, selected_item_name: None, edited_tree_item: None),
              effect.none(),
            )
          }
        }
        None -> #(model, effect.none())
      }
    }

    LoroDocCreated(loro_doc) -> #(
      Model(..model, loro_doc: Some(loro_doc)),
      effect.none(),
    )
    UserDraggedItemOver(id) -> #(
      Model(..model, dragged_over_tree_item: Some(id)),
      effect.none(),
    )
    UserDroppedItem(item, folder) -> {
      #(Model(..model, dragged_over_tree_item: None), case model.loro_doc {
        Some(loro_doc) -> {
          move_item(loro_doc, item, folder)
        }

        None -> {
          effect.none()
        }
      })
    }
    UserDraggedItemOff(id) -> {
      #(
        case model.dragged_over_tree_item {
          Some(dragged_item) -> {
            case dragged_item == id {
              True -> Model(..model, dragged_over_tree_item: None)
              False -> model
            }
          }
          None -> model
        },
        effect.none(),
      )
    }
    RenderTree(root) -> {
      case model.tree {
        Some(_old_tree) -> {
          #(Model(..model, tree: Some(root)), init_dnd())
        }
        None -> {
          #(Model(..model, tree: Some(root)), init_dnd())
        }
      }
    }

    SaveDocument -> #(model, save_document())
    ToggleModal -> #(Model(..model, modal: !model.modal), effect.none())

    DisplaySelectedRooms(selected_rooms) -> #(
      Model(..model, selected_rooms:),
      effect.none(),
    )
    DisplayBasicToast(content) -> #(model, success_toast(content))
    DisplayErrorToast(content) -> #(model, error_toast(content))
  }
}

fn view(model: Model, stylesheet) -> Element(Msg) {
  use <- sketch_lustre.render(stylesheet:, in: [sketch_lustre.node()])

  case model.password {
    Some(_) -> {
      notebook_editor_view(model)
    }
    None -> {
      html.form(class([]), [event.on_submit(PasswordSumbitted)], [
        html.label(class([]), [], [
          html.div(class([]), [], [html.text("قم بإدخال كلمة السر")]),
          // error_element,
          html.input(class([]), [
            attribute.type_("password"),
            attribute.name("password"),
            attribute.value(form.value(model.password_form, "password")),
          ]),
        ]),
        html.button(
          class([]),
          [attribute.type_("submit"), attribute.id("access-token-button")],
          [html.text("ارسال")],
        ),
      ])
    }
  }
}

type LoroDoc

fn init_dnd() {
  use dispatch, _ <- effect.after_paint

  let tree_items: array.Array(browser_element.Element) =
    document.query_selector_all(".tree-item")

  let tree_item_list = tree_items |> array.to_list

  let filtered_drop_items =
    tree_item_list
    |> list.filter(fn(drop_item_element) {
      case
        drop_item_element
        |> browser_element.get_attribute("data-drop-target-for-element")
      {
        Ok(_) -> {
          False
        }
        Error(_) -> True
      }
    })
    |> array.from_list

  do_make_drop_target(
    folders: filtered_drop_items,
    on_drag_enter: fn(item_id) { dispatch(UserDraggedItemOver(item_id)) },
    on_drag_leave: fn(item_id) { dispatch(UserDraggedItemOff(item_id)) },
    on_drop: fn(item, folder) { dispatch(UserDroppedItem(item, folder)) },
  )

  let tree_item_list = tree_items |> array.to_list

  let filtered_tree_items =
    tree_item_list
    |> list.filter(fn(tree_item_element) {
      case tree_item_element |> browser_element.get_attribute("draggable") {
        Ok(_) -> False
        Error(_) -> True
      }
    })
    |> array.from_list

  do_make_draggable(filtered_tree_items)
}

fn notebook_editor_view(model: Model) {
  element.fragment([
    case model.modal {
      True -> {
        html.div(
          class([
            css.position("fixed"),
            css.top(length.rem(0.8)),
            css.right(length.rem(0.8)),
            css.padding(length.rem(1.0)),
            css.background("rgb(26 26 46)"),
            css.border_radius(length.px(16)),
            css.backdrop_filter("blur(16px)"),
            css.border("1px solid rgb(61, 61, 142)"),
            css.z_index(100),
          ]),
          [],
          [
            html.div(
              class([
                css.display("flex"),
                css.direction("rtl"),
                css.flex_direction("row"),
                css.gap(length.rem(0.75)),
              ]),
              [],
              [
                html.button(
                  class([
                    css.z_index(200),
                    css.display("flex"),
                    css.align_items("center"),
                    css.justify_content("center"),
                    css.width(length.rem(3.0)),
                    css.height(length.rem(3.0)),
                    css.background(
                      "linear-gradient(135deg, rgba(220, 38, 127, 0.9), rgba(180, 28, 100, 0.9))",
                    ),
                    css.border("1px solid rgb(61, 61, 142)"),
                    css.color("#ffffff"),
                    css.border_radius(length.px(12)),
                    css.cursor("pointer"),
                    css.font_size(length.rem(1.3)),
                    css.font_weight("600"),
                    css.letter_spacing("0.5px"),
                    css.transition("all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"),
                    css.box_shadow(
                      "0 6px 20px rgba(220, 38, 127, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                    ),
                    css.hover([
                      css.background(
                        "linear-gradient(135deg, rgba(220, 38, 127, 1), rgba(240, 48, 140, 1))",
                      ),
                      css.transform([
                        transform.translate_y(length.px(-3)),
                        transform.scale(1.02, 1.08),
                      ]),
                      css.box_shadow(
                        "0 10px 30px rgba(220, 38, 127, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
                      ),
                      css.border("1px solid rgb(61, 61, 142)"),
                    ]),
                    css.active([
                      css.transform([transform.translate_y(length.px(-1))]),
                    ]),
                  ]),
                  [event.on_click(ToggleModal)],
                  [menu_svg(" #FFFFFF ")],
                ),
                html.button(
                  class([
                    css.z_index(200),
                    css.display("flex"),
                    css.align_items("center"),
                    css.justify_content("center"),
                    css.padding_right(length.rem(1.0)),
                    css.padding_left(length.rem(1.0)),
                    css.padding_top(length.rem(0.75)),
                    css.padding_bottom(length.rem(0.75)),
                    css.min_height(length.rem(2.5)),
                    css.background("#1a1a2ef2"),
                    css.border("1px solid rgb(61, 61, 142)"),
                    css.color("#ffffff"),
                    css.border_radius(length.px(12)),
                    css.cursor("pointer"),
                    css.font_size(length.rem(0.9)),
                    css.font_weight("600"),
                    css.letter_spacing("0.3px"),
                    css.transition("all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"),
                    css.hover([
                      css.transform([
                        transform.translate_y(length.px(-3)),
                        transform.scale(1.02, 1.08),
                      ]),
                      css.border("1px solid rgb(61, 61, 142)"),
                    ]),
                    css.active([
                      css.transform([transform.translate_y(length.px(-1))]),
                    ]),
                  ]),
                  [event.on_click(SaveDocument)],
                  [html.text("قم بحفظ المذكرة")],
                ),
                html.button(
                  class([
                    css.z_index(200),
                    css.display("flex"),
                    css.align_items("center"),
                    css.justify_content("center"),
                    css.padding_right(length.rem(1.0)),
                    css.padding_left(length.rem(1.0)),
                    css.padding_top(length.rem(0.75)),
                    css.padding_bottom(length.rem(0.75)),
                    css.min_height(length.rem(2.5)),
                    css.background("#1a1a2ef2"),
                    css.border("1px solid rgb(61, 61, 142)"),
                    css.color("#ffffff"),
                    css.border_radius(length.px(12)),
                    css.cursor("pointer"),
                    css.font_size(length.rem(0.9)),
                    css.font_weight("600"),
                    css.letter_spacing("0.3px"),
                    css.transition("all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"),
                    css.hover([
                      css.transform([
                        transform.translate_y(length.px(-3)),
                        transform.scale(1.02, 1.08),
                      ]),
                      css.border("1px solid rgb(61, 61, 142)"),
                    ]),
                    css.active([
                      css.transform([transform.translate_y(length.px(-1))]),
                    ]),
                  ]),
                  [event.on_click(DownloadNoteBook)],
                  [html.text("قم بتحميل المذكرة بصيغة ملف")],
                ),
              ],
            ),
            case model.tree {
              Some(root) ->
                element.fragment([
                  tree_view(model, root),
                  case model.filesystem_menu {
                    Some([item_id, y]) -> {
                      let y =
                        int.parse(y)
                        |> result.lazy_unwrap(fn() { 0 })
                      html.div(
                        class([
                          css.top(length.px(y)),
                          css.position("absolute"),
                          css.background_color("rgb(3, 29, 40)"),
                          css.border("1px solid rgb(61, 61, 142)"),
                          css.border_radius(length.px(8)),
                          css.box_shadow("0 4px 12px rgba(0, 0, 0, 0.1)"),
                          css.padding(length.px(4)),
                          css.min_width(length.px(180)),
                          css.z_index(300),
                          css.font_family(
                            "system-ui, -apple-system, sans-serif",
                          ),
                          css.font_size(length.px(14)),
                        ]),
                        [],
                        [
                          html.button(
                            class([
                              css.display("flex"),
                              css.align_items("center"),
                              css.padding_left(length.px(8)),
                              css.padding_right(length.px(12)),
                              css.padding_top(length.px(8)),
                              css.padding_bottom(length.px(8)),
                              css.cursor("pointer"),
                              css.border_radius(length.px(4)),
                              css.border("none"),
                              css.background_color("transparent"),
                              css.color("#e2e8f0"),
                              css.transition("all 0.2s ease"),
                              css.width(length.percent(100)),
                              css.text_align("left"),
                              css.hover([
                                css.background_color("rgba(59, 130, 246, 0.1)"),
                                css.color("#3b82f6"),
                              ]),
                            ]),
                            [event.on_click(CreateNewNote(item_id))],
                            [
                              html.div(
                                class([
                                  css.width(length.px(16)),
                                  css.height(length.px(16)),
                                  css.margin_right(length.px(8)),
                                  css.display("flex"),
                                  css.align_items("center"),
                                  css.justify_content("center"),
                                ]),
                                [],
                                [html.text("📄")],
                              ),
                              html.text("ملف جديد"),
                            ],
                          ),
                          html.button(
                            class([
                              css.display("flex"),
                              css.align_items("center"),
                              css.padding_left(length.px(8)),
                              css.padding_right(length.px(12)),
                              css.padding_top(length.px(8)),
                              css.padding_bottom(length.px(8)),
                              css.cursor("pointer"),
                              css.border_radius(length.px(4)),
                              css.border("none"),
                              css.background_color("transparent"),
                              css.color("#e2e8f0"),
                              css.transition("all 0.2s ease"),
                              css.width(length.percent(100)),
                              css.text_align("left"),
                              css.hover([
                                css.background_color("rgba(59, 130, 246, 0.1)"),
                                css.color("#3b82f6"),
                              ]),
                            ]),
                            [event.on_click(CreateNewFolder(item_id))],
                            [
                              html.div(
                                class([
                                  css.width(length.px(16)),
                                  css.height(length.px(16)),
                                  css.margin_right(length.px(8)),
                                  css.display("flex"),
                                  css.align_items("center"),
                                  css.justify_content("center"),
                                ]),
                                [],
                                [html.text("📁")],
                              ),
                              html.text("مجلد جديد"),
                            ],
                          ),
                        ],
                      )
                    }
                    _ -> {
                      element.none()
                    }
                  },
                ])
              None -> element.none()
            },
          ],
        )
      }
      False -> {
        html.button(
          class([
            css.z_index(200),
            css.position("fixed"),
            css.display("flex"),
            css.top(length.rem(1.5)),
            css.right(length.rem(1.5)),
            css.align_items("center"),
            css.justify_content("center"),
            css.width(length.rem(3.0)),
            css.height(length.rem(3.0)),
            css.background(
              "linear-gradient(135deg, rgba(220, 38, 127, 0.9), rgba(180, 28, 100, 0.9))",
            ),
            css.border("2px solid rgb(61, 61, 142)"),
            css.color("#ffffff"),
            css.border_radius(length.px(10)),
            css.cursor("pointer"),
            css.font_size(length.rem(1.2)),
            css.font_weight("600"),
            css.letter_spacing("1px"),
            css.transition("all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"),
            css.box_shadow(
              "0 4px 15px rgba(220, 38, 127, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
            ),
            css.hover([
              css.background(
                "linear-gradient(135deg, rgba(220, 38, 127, 1), rgba(240, 48, 140, 1))",
              ),
              css.transform([
                transform.translate_y(length.px(-2)),
                transform.scale(1.0, 1.05),
              ]),
              css.box_shadow(
                "0 8px 25px rgba(220, 38, 127, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
              ),
              css.border("2px solid rgb(61, 61, 142)"),
            ]),
            css.active([css.transform([transform.translate_y(length.px(0))])]),
          ]),
          [event.on_click(ToggleModal)],
          [menu_svg(" #FFFFFF ")],
        )
      }
    },
    lustre_element.unsafe_raw_html(
      "",
      "div",
      [attribute.class("editor")],
      floating_menu(),
    ),
  ])
}

fn floating_menu() {
  html.div(class([]), [attribute.class("menu")], [
    html.button(
      class([
        css.z_index(200),
        css.display("flex"),
        css.align_items("center"),
        css.justify_content("center"),
        css.width(length.rem(2.0)),
        css.height(length.rem(2.0)),
        css.background(
          "linear-gradient(135deg, rgba(220, 38, 127, 0.9), rgba(180, 28, 100, 0.9))",
        ),
        css.border("1px solid rgb(61, 61, 142)"),
        css.color("#ffffff"),
        css.border_radius(length.px(12)),
        css.cursor("pointer"),
        css.font_size(length.rem(1.0)),
        css.font_weight("600"),
        css.letter_spacing("0.5px"),
        css.transition("all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"),
        css.box_shadow(
          "0 6px 20px rgba(220, 38, 127, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
        ),
        css.hover([
          css.background(
            "linear-gradient(135deg, rgba(220, 38, 127, 1), rgba(240, 48, 140, 1))",
          ),
          css.transform([
            transform.translate_y(length.px(-3)),
            transform.scale(1.02, 1.08),
          ]),
          css.box_shadow(
            "0 10px 30px rgba(220, 38, 127, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
          ),
          css.border("1px solid rgb(61, 61, 142)"),
        ]),
        css.active([css.transform([transform.translate_y(length.px(-1))])]),
      ]),
      [
        attribute.attribute(
          "onclick",
          "editor.chain().focus().setDetails().run()",
        ),
      ],
      [html.text("▶")],
    ),
  ])
  |> lustre_element.to_string
}

@external(javascript, "./js/editor.ts", "make_drop_target")
fn do_make_drop_target(
  folders folders: array.Array(a),
  on_drag_enter on_drag_enter: fn(String) -> Nil,
  on_drag_leave on_drag_leave: fn(String) -> Nil,
  on_drop on_drop: fn(String, String) -> Nil,
) -> Nil

@external(javascript, "./js/editor.ts", "get_tree")
fn get_tree(
  loro_doc: LoroDoc,
  room_id: String,
  on_tree: fn(String) -> Nil,
) -> String

@external(javascript, "./js/editor.ts", "create_loro_doc")
fn create_loro_doc(room_id: String) -> Promise(LoroDoc)

@external(javascript, "./js/editor.ts", "move_item")
fn do_move_item(loro_doc: LoroDoc, item: String, folder: String) -> Nil

@external(javascript, "./js/editor.ts", "delete_item")
fn do_delete_item(loro_doc: LoroDoc, item: String) -> Nil

@external(javascript, "./js/editor.ts", "change_item_name")
fn do_change_item_name(
  loro_doc: LoroDoc,
  item: String,
  item_name: String,
  on_change_name: fn() -> Nil,
) -> Nil

@external(javascript, "./js/editor.ts", "make_draggable")
fn do_make_draggable(elements: array.Array(a)) -> Nil

@external(javascript, "./js/editor.ts", "check_password")
fn do_check_password(
  password: String,
  on_password_checked: fn(Result(Nil, Nil)) -> Nil,
) -> Nil

fn check_password(password: String) -> Effect(Msg) {
  use dispatch <- effect.from
  do_check_password(password, fn(result) {
    case result {
      Ok(_) -> {
        dispatch(PasswordIsValid(password))
      }
      Error(_) -> {
        dispatch(DisplayErrorToast("كلمة السر غير صحيحة"))
      }
    }
  })
}

pub type Node {
  Node(
    id: String,
    parent: Option(String),
    index: Int,
    meta: Dict(String, decode.Dynamic),
    children: List(Node),
  )
}

pub fn node_decoder() {
  use id <- decode.field("id", decode.string)
  use parent <- decode.optional_field(
    "parent",
    None,
    decode.optional(decode.string),
  )
  use index <- decode.field("index", decode.int)
  use meta <- decode.field("meta", decode.dict(decode.string, decode.dynamic))
  use children <- decode.optional_field(
    "children",
    [],
    decode.list(node_decoder()),
  )

  decode.success(Node(
    id: id,
    parent: parent,
    index: index,
    meta: meta,
    children: children,
  ))
}

fn menu_svg(color color: String) -> Element(Msg) {
  html.svg(
    class([]),
    [
      attribute("xml:space", "preserve"),
      attribute("viewBox", "0 0 297 297"),
      attribute("xmlns:xlink", "http://www.w3.org/1999/xlink"),
      attribute("xmlns", "http://www.w3.org/2000/svg"),
      attribute.id("Layer_1"),
      attribute("version", "1.1"),
      attribute("width", "30px"),
      attribute("height", "30px"),
      attribute("fill", color),
    ],
    [
      svg.g([], [
        svg.g([], [
          svg.g([], [
            svg.path([
              attribute(
                "d",
                "M279.368,24.726H102.992c-9.722,0-17.632,7.91-17.632,17.632V67.92c0,9.722,7.91,17.632,17.632,17.632h176.376
				c9.722,0,17.632-7.91,17.632-17.632V42.358C297,32.636,289.09,24.726,279.368,24.726z",
              ),
            ]),
            svg.path([
              attribute(
                "d",
                "M279.368,118.087H102.992c-9.722,0-17.632,7.91-17.632,17.632v25.562c0,9.722,7.91,17.632,17.632,17.632h176.376
				c9.722,0,17.632-7.91,17.632-17.632v-25.562C297,125.997,289.09,118.087,279.368,118.087z",
              ),
            ]),
            svg.path([
              attribute(
                "d",
                "M279.368,211.448H102.992c-9.722,0-17.632,7.91-17.632,17.633v25.561c0,9.722,7.91,17.632,17.632,17.632h176.376
				c9.722,0,17.632-7.91,17.632-17.632v-25.561C297,219.358,289.09,211.448,279.368,211.448z",
              ),
            ]),
            svg.path([
              attribute(
                "d",
                "M45.965,24.726H17.632C7.91,24.726,0,32.636,0,42.358V67.92c0,9.722,7.91,17.632,17.632,17.632h28.333
				c9.722,0,17.632-7.91,17.632-17.632V42.358C63.597,32.636,55.687,24.726,45.965,24.726z",
              ),
            ]),
            svg.path([
              attribute(
                "d",
                "M45.965,118.087H17.632C7.91,118.087,0,125.997,0,135.719v25.562c0,9.722,7.91,17.632,17.632,17.632h28.333
				c9.722,0,17.632-7.91,17.632-17.632v-25.562C63.597,125.997,55.687,118.087,45.965,118.087z",
              ),
            ]),
            svg.path([
              attribute(
                "d",
                "M45.965,211.448H17.632C7.91,211.448,0,219.358,0,229.081v25.561c0,9.722,7.91,17.632,17.632,17.632h28.333
				c9.722,0,17.632-7.91,17.632-17.632v-25.561C63.597,219.358,55.687,211.448,45.965,211.448z",
              ),
            ]),
          ]),
        ]),
      ]),
    ],
  )
}

@external(javascript, "./js/editor.ts", "download_notebook")
fn do_download_notebook(loro_doc: LoroDoc) -> Nil

fn download_notebook(loro_doc: LoroDoc) -> Effect(Msg) {
  use _ <- effect.from

  do_download_notebook(loro_doc)
}

@external(javascript, "./js/editor.ts", "user_selected_note")
fn do_user_selected_note(item_id: String) -> Nil

fn user_selected_note(item_id) -> Effect(Msg) {
  use _ <- effect.from
  do_user_selected_note(item_id)
}

fn create_new_note(loro_doc: LoroDoc, item_id: String) -> Effect(Msg) {
  use _ <- effect.from
  do_create_new_note(loro_doc, item_id)
}

@external(javascript, "./js/editor.ts", "create_new_note")
fn do_create_new_note(loro_doc: LoroDoc, item_id: String) -> Nil

fn create_new_folder(loro_doc: LoroDoc, item_id) -> Effect(Msg) {
  use _ <- effect.from
  do_create_new_folder(loro_doc, item_id)
}

@external(javascript, "./js/editor.ts", "create_new_folder")
fn do_create_new_folder(loro_doc: LoroDoc, item_id: String) -> Nil

fn change_item_name(loro_doc: LoroDoc, item_id, item_name) -> Effect(Msg) {
  use dispatch <- effect.from

  do_change_item_name(loro_doc, item_id, item_name, fn() {
    dispatch(UserCanceledEditingItem)
  })
}

fn delete_item(loro_doc: LoroDoc, item: String) -> Effect(Msg) {
  use _ <- effect.from

  do_delete_item(loro_doc, item)
}

fn move_item(loro_doc: LoroDoc, item: String, folder: String) -> Effect(Msg) {
  use _ <- effect.from

  do_move_item(loro_doc, item, folder)
}

@external(javascript, "./js/editor.ts", "save_document")
fn do_save_document() -> Nil

fn save_document() {
  use _ <- effect.from

  do_save_document()
}

@external(javascript, "./js/editor.ts", "init_tiptap")
fn do_init_tiptap(doc: LoroDoc) -> Nil

fn init_tiptap() {
  use dispatch, _ <- effect.after_paint

  promise.tap(create_loro_doc("noter"), fn(loro_doc) {
    dispatch(LoroDocCreated(loro_doc))

    get_tree(loro_doc, "noter", fn(tree) {
      let results = json.parse(from: tree, using: node_decoder())

      case results {
        Ok(root) -> {
          dispatch(RenderTree(root))
        }
        Error(error) -> {
          echo error
          Nil
        }
      }
    })

    do_init_tiptap(loro_doc)
  })

  Nil
}

fn success_toast(content: String) {
  toast.options()
  |> toast.level(level.Success)
  |> toast.custom(content)
}

fn error_toast(content) {
  toast.options()
  |> toast.timeout(10_000)
  |> toast.level(level.Error)
  |> toast.custom(content)
}

pub type TreeItemType {
  Folder
  File
}

pub type TreeItem {
  TreeItem(
    id: String,
    name: String,
    item_type: TreeItemType,
    children: List(TreeItem),
  )
}

fn get_item_class(item_type: String) -> String {
  case item_type {
    "folder" -> "tree-item tree-folder"
    "file" -> "tree-item tree-file"
    _ -> panic
  }
}

fn get_expand_icon(item_type: String, is_expanded: Bool) -> String {
  case item_type {
    "folder" ->
      case is_expanded {
        True -> "▼"
        False -> "▶"
      }
    "file" -> ""
    _ -> panic
  }
}

fn get_item_icon(item_type: String) -> String {
  case item_type {
    "folder" -> "📁"
    "file" -> "📄"
    _ -> panic
  }
}

fn tree_item_view(
  is_root: Bool,
  item item: Node,
  model model: Model,
) -> Element(Msg) {
  let is_dragged = {
    case model.dragged_over_tree_item {
      Some(item_id) -> {
        item_id == item.id
      }
      None -> False
    }
  }

  let assert Ok(item_type_value) = item.meta |> dict.get("item_type")
  let assert Ok(item_type) = decode.run(item_type_value, decode.string)

  let name_value = item.meta |> dict.get("name")
  let name = {
    case name_value {
      Ok(name_value) -> {
        case decode.run(name_value, decode.string) {
          Ok(name) -> name
          Error(_) -> "بلا عنوان"
        }
      }
      Error(_) -> "بلا عنوان"
    }
  }

  let tree_item_classes = [
    attribute.classes([
      #(get_item_class(item_type), True),
      #("drop-target", is_dragged),
    ]),
    attribute.data("item_type", item_type),
    attribute.data("drag_id", item.id),
    case item.parent {
      Some(parent_id) -> attribute.data("parent_id", parent_id)
      None -> attribute.none()
    },
    case item_type {
      "folder" -> {
        event.on("click", {
          use y <- decode.field("clientY", decode.int)

          let y = int.to_string(y)

          decode.success(DisplayFileSystemMenu(item.id, y))
        })
      }
      "file" -> {
        event.on_click(UserSelectedNote(item.id))
      }
      _ -> attribute.none()
    },
  ]

  let file_system_menu_handler = case item_type {
    "folder" -> {
      event.stop_propagation(
        event.on("click", {
          use y <- decode.field("clientY", decode.int)
          let y = int.to_string(y)

          decode.success(DisplayFileSystemMenu(item.id, y))
        }),
      )
    }
    "file" -> {
      case item.parent {
        Some(parent_id) -> {
          event.stop_propagation(
            event.on("click", {
              use y <- decode.field("clientY", decode.int)

              let y = int.to_string(y)

              decode.success(DisplayFileSystemMenu(parent_id, y))
            }),
          )
        }
        None -> attribute.none()
      }
    }
    _ -> attribute.none()
  }

  html.div(
    class([]),
    case is_root {
      True -> {
        tree_item_classes
        |> list.append([
          attribute.class("root-node"),
          attribute.draggable(False),
          event.on("click", {
            use y <- decode.field("clientY", decode.int)

            let y = int.to_string(y)

            decode.success(DisplayFileSystemMenu(item.id, y))
          }),
        ])
      }
      False -> tree_item_classes
    },
    case is_root {
      True -> []

      False -> {
        [
          case item_type {
            "folder" -> {
              case item.children {
                [] -> element.none()
                _ -> {
                  html.span(
                    class([]),
                    [
                      event.stop_propagation(
                        event.on_click(ToggleFolderExpanded(item.id)),
                      ),
                      attribute.class("expand-icon"),
                    ],
                    [
                      html.text(get_expand_icon(
                        item_type,
                        model.expanded_folders |> list.contains(item.id),
                      )),
                    ],
                  )
                }
              }
            }
            "file" -> {
              element.none()
            }
            _ -> {
              element.none()
            }
          },
          html.span(class([]), [attribute.class("tree-icon")], [
            html.text(get_item_icon(item_type)),
          ]),
          {
            let default_item =
              html.span(class([]), [attribute.class("tree-name")], [
                html.text(name),
              ])

            case model.edited_tree_item {
              Some(item_id) -> {
                case item_id == item.id {
                  True -> {
                    html.input(class([]), [
                      attribute.class("tree-name"),
                      case model.selected_item_name {
                        Some(value) -> {
                          attribute.value(value)
                        }
                        None -> {
                          attribute.value(name)
                        }
                      },
                      event.on_input(ItemNameHasChanged),
                    ])
                  }
                  False -> {
                    default_item
                  }
                }
              }
              None -> {
                default_item
              }
            }
          },
          case model.edited_tree_item {
            Some(item_id) -> {
              case item_id == item.id {
                True -> {
                  element.fragment([
                    html.button(
                      class([]),
                      [
                        attribute.class("edit-button"),
                        event.stop_propagation(
                          event.on_click(UserFinishedEditingItem(item.id)),
                        ),
                      ],
                      [html.text("✅")],
                    ),
                    html.button(
                      class([]),
                      [
                        attribute.class("edit-button"),
                        event.stop_propagation(event.on_click(
                          UserCanceledEditingItem,
                        )),
                      ],
                      [html.text("❌")],
                    ),
                  ])
                }
                False ->
                  element.fragment([
                    html.button(
                      class([]),
                      [attribute.class("edit-button"), file_system_menu_handler],
                      [html.text("➕")],
                    ),
                    html.button(
                      class([]),
                      [
                        attribute.class("edit-button"),
                        event.stop_propagation(
                          event.on_click(UserEditingItem(item.id)),
                        ),
                      ],
                      [html.text("✏️")],
                    ),
                    html.button(
                      class([]),
                      [
                        attribute.class("edit-button"),
                        event.stop_propagation(
                          event.on_click(DeleteItem(item.id)),
                        ),
                      ],
                      [html.text("🗑️")],
                    ),
                  ])
              }
            }
            None ->
              element.fragment([
                html.button(
                  class([]),
                  [attribute.class("edit-button"), file_system_menu_handler],
                  [html.text("➕")],
                ),
                html.button(
                  class([]),
                  [
                    attribute.class("edit-button"),
                    event.stop_propagation(
                      event.on_click(UserEditingItem(item.id)),
                    ),
                  ],
                  [html.text("✏️")],
                ),
                html.button(
                  class([]),
                  [
                    attribute.class("edit-button"),
                    event.stop_propagation(event.on_click(DeleteItem(item.id))),
                  ],
                  [html.text("🗑️")],
                ),
              ])
          },
        ]
      }
    },
  )
}

fn tree_children_view(
  is_item_at_root: Bool,
  children: List(Node),
  model: Model,
) -> Element(Msg) {
  let get_item_info = fn(item: Node) {
    let assert Ok(type_value) = item.meta |> dict.get("item_type")
    let assert Ok(item_type) = decode.run(type_value, decode.string)

    let name = case item.meta |> dict.get("name") {
      Ok(value) -> {
        let assert Ok(name) = decode.run(value, decode.string)
        Some(name)
      }
      Error(_) -> None
    }

    #(item_type, name)
  }

  html.div(
    class([]),
    [
      case is_item_at_root {
        True -> {
          attribute.none()
        }
        False -> {
          attribute.class("tree-children")
        }
      },
    ],
    children
      |> list.sort(fn(a, b) {
        let #(a_type, a_name) = get_item_info(a)
        let #(b_type, b_name) = get_item_info(b)

        case a_type, b_type {
          "folder", "file" -> order.Lt
          "file", "folder" -> order.Gt
          _, _ -> {
            case a_name, b_name {
              Some(name_a), Some(name_b) -> string.compare(name_a, name_b)
              Some(_), None -> order.Lt
              None, Some(_) -> order.Gt
              None, None -> order.Eq
            }
          }
        }
      })
      |> list.map(fn(child) {
        let #(item_type, _) = get_item_info(child)

        case item_type {
          "folder" -> {
            [
              tree_item_view(False, child, model),
              case child.children {
                [] -> element.none()
                _ -> {
                  case model.expanded_folders |> list.contains(child.id) {
                    True -> tree_children_view(False, child.children, model)
                    False -> element.none()
                  }
                }
              },
            ]
          }
          "file" -> [tree_item_view(False, child, model)]
          _ -> panic
        }
      })
      |> list.flatten,
  )
}

fn tree_view(model: Model, tree: Node) -> Element(Msg) {
  html.div(class([]), [attribute.class("tree")], [
    case tree.children {
      [] -> element.none()
      _ -> tree_children_view(True, tree.children, model)
    },
    tree_item_view(True, tree, model),
  ])
}
